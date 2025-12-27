import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { BackPagePostDetail } from '@/components/backpage/backpage-post-detail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.backPagePost.findUnique({
    where: { slug },
    select: { title: true, body: true },
  })

  if (!post) {
    return { title: 'Post Not Found | UndeadList' }
  }

  return {
    title: `${post.title} | バックページ | UndeadList`,
    description: post.body.slice(0, 160),
    alternates: {
      canonical: `/backpage/${slug}`,
    },
  }
}

export default async function BackPagePostPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const post = await prisma.backPagePost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          sellerTier: true,
        },
      },
      replies: {
        where: { status: 'ACTIVE' }, // Only show active (not removed) replies
        include: {
          author: {
            select: {
              id: true,
              username: true,
              sellerTier: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!post) {
    notFound()
  }

  // Check if removed
  if (post.status === 'REMOVED') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Post Removed</h1>
          <p className="text-text-secondary">
            This post has been removed for violating community guidelines.
          </p>
        </div>
      </div>
    )
  }

  // Check if expired
  if (new Date(post.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Post Expired</h1>
          <p className="text-text-secondary">
            This post has been reset with the weekly cleanup.
          </p>
        </div>
      </div>
    )
  }

  // Get user's vote if logged in
  let userVote = 0
  if (session?.user?.id) {
    const vote = await prisma.backPageVote.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId: session.user.id,
        },
      },
    })
    userVote = vote?.value || 0
  }

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    text: post.body,
    author: {
      '@type': 'Person',
      name: post.author.username,
    },
    datePublished: post.createdAt.toISOString(),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.upvotes,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post.replyCount,
      },
    ],
  }

  const postWithUserVote = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    expiresAt: post.expiresAt.toISOString(),
    replies: post.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    userVote,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackPagePostDetail post={postWithUserVote} />
    </>
  )
}
