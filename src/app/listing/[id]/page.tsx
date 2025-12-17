import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ListingDetail } from '@/components/listings/listing-detail'
import { CommentSection } from '@/components/comments/comment-section'

interface ListingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params

  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: 'ACTIVE',
    },
    select: {
      title: true,
      shortDescription: true,
      thumbnailUrl: true,
    },
  })

  if (!listing) {
    return { title: 'Listing Not Found' }
  }

  return {
    title: listing.title,
    description: listing.shortDescription,
    openGraph: {
      title: listing.title,
      description: listing.shortDescription,
      images: listing.thumbnailUrl ? [listing.thumbnailUrl] : [],
    },
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const session = await auth()

  // Find listing by id or slug
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: 'ACTIVE',
    },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isVerifiedSeller: true,
          createdAt: true,
          _count: {
            select: {
              listings: { where: { status: 'ACTIVE' } },
              sales: { where: { status: 'COMPLETED' } },
            },
          },
        },
      },
      category: true,
      files: true,
      _count: {
        select: {
          comments: true,
          purchases: true,
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Increment view count (don't await, fire and forget)
  prisma.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  // Check if current user is the owner
  const isOwner = session?.user?.id === listing.sellerId

  // Get user's vote if logged in
  let currentUserVote: 1 | -1 | null = null
  if (session?.user?.id) {
    const vote = await prisma.vote.findUnique({
      where: {
        listingId_userId: {
          listingId: listing.id,
          userId: session.user.id,
        },
      },
    })
    currentUserVote = vote?.value as 1 | -1 | null
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="breadcrumbs mb-4">
        <Link href="/">Home</Link>
        <span>&gt;</span>
        <Link href="/listings">Listings</Link>
        <span>&gt;</span>
        <Link href={`/category/${listing.category.slug}`}>{listing.category.name}</Link>
        <span>&gt;</span>
        <span>{listing.title}</span>
      </nav>

      <ListingDetail
        listing={listing}
        isOwner={isOwner}
        currentUserVote={currentUserVote}
      />

      {/* Comments Section */}
      <CommentSection
        listingId={listing.id}
        listingOwnerId={listing.sellerId}
        initialCommentCount={listing._count.comments}
      />
    </div>
  )
}
