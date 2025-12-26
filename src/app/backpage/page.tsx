import { Metadata } from 'next'
import Link from 'next/link'
import { BackPageCategory, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CATEGORY_LABELS, getTimeUntilReset, VALID_CATEGORIES } from '@/lib/backpage'
import { BackPageList } from '@/components/backpage/backpage-list'

export const metadata: Metadata = {
  title: 'バックページ - Community Board | UndeadList',
  description:
    'Weekly community discussion board for indie developers. Share projects, ask questions, find collaborators.',
  alternates: {
    canonical: '/backpage',
  },
}

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function BackPagePage({ searchParams }: Props) {
  const params = await searchParams
  const category = params.category || 'ALL'
  const page = Math.max(1, parseInt(params.page || '1'))
  const limit = 20

  // Build where clause
  const where: Prisma.BackPagePostWhereInput = {
    expiresAt: { gt: new Date() },
  }

  if (category !== 'ALL' && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    where.category = category as BackPageCategory
  }

  const [posts, total, stats] = await Promise.all([
    prisma.backPagePost.findMany({
      where,
      include: {
        author: {
          select: {
            username: true,
            sellerTier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.backPagePost.count({ where }),
    prisma.backPagePost.aggregate({
      where: { expiresAt: { gt: new Date() } },
      _count: true,
      _sum: { replyCount: true },
    }),
  ])

  const timeUntilReset = getTimeUntilReset()
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="text-text-secondary mr-2">バックページ</span>
              Back Page
            </h1>
            <p className="text-text-secondary text-sm">
              Weekly community board - Resets every Monday
            </p>
          </div>
          <Link
            href="/backpage/new"
            className="px-4 py-2 bg-accent-cyan text-black font-medium rounded-lg hover:bg-accent-cyan/90 transition-colors"
          >
            New Post
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['ALL', 'GENERAL', 'SHOW_TELL', 'LOOKING_FOR', 'HELP'].map((cat) => (
            <Link
              key={cat}
              href={`/backpage${cat === 'ALL' ? '' : `?category=${cat}`}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-accent-cyan text-black'
                  : 'bg-zinc-800 text-text-secondary hover:bg-zinc-700'
              }`}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* Posts List */}
        <BackPageList posts={posts as unknown as Parameters<typeof BackPageList>[0]['posts']} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/backpage?page=${page - 1}${category !== 'ALL' ? `&category=${category}` : ''}`}
                className="px-4 py-2 bg-zinc-800 text-text-secondary rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-text-secondary">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/backpage?page=${page + 1}${category !== 'ALL' ? `&category=${category}` : ''}`}
                className="px-4 py-2 bg-zinc-800 text-text-secondary rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-8 pt-6 border-t border-zinc-800 text-center text-sm text-text-secondary">
          <p>
            Posts: {stats._count} • Replies: {stats._sum.replyCount || 0} • Resets in:{' '}
            {timeUntilReset}
          </p>
        </div>
      </div>
    </div>
  )
}
