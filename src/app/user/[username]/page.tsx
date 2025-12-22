import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { ListingGrid } from '@/components/listings/listing-grid'
import { VerifiedBadge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: { username: true, displayName: true },
  })

  if (!user) return { title: 'User Not Found' }

  return {
    title: `${user.displayName || `@${user.username}`} - Seller Profile`,
    description: `View listings from ${user.displayName || `@${user.username}`} on UndeadList`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      websiteUrl: true,
      twitterHandle: true,
      githubHandle: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          listings: { where: { status: 'ACTIVE' } },
          sales: { where: { status: 'COMPLETED' } },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Get user's active listings
  const listings = await prisma.listing.findMany({
    where: {
      sellerId: user.id,
      status: 'ACTIVE',
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      seller: { select: { username: true, displayName: true, avatarUrl: true, isVerifiedSeller: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { votes: true, comments: true } },
    },
  })

  // Calculate stats
  const totalSales = user._count.sales
  const activeListings = user._count.listings

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-btn-bg border-2 border-border-dark flex items-center justify-center font-display text-3xl">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              user.displayName?.[0] || user.username[0].toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-2xl">
                {user.displayName || `@${user.username}`}
              </h1>
              {user.emailVerified && <VerifiedBadge />}
            </div>

            <div className="text-text-muted mb-3">@{user.username}</div>

            {user.bio && (
              <p className="text-text-secondary mb-4 max-w-2xl">{user.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-4 text-sm">
              {user.websiteUrl && (
                <a
                  href={user.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  🌐 Website
                </a>
              )}
              {user.twitterHandle && (
                <a
                  href={`https://twitter.com/${user.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  𝕏 @{user.twitterHandle}
                </a>
              )}
              {user.githubHandle && (
                <a
                  href={`https://github.com/${user.githubHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="text-right">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-2xl font-mono">{activeListings}</div>
                <div className="text-sm text-text-muted">Listings</div>
              </div>
              <div>
                <div className="text-2xl font-mono">{totalSales}</div>
                <div className="text-sm text-text-muted">Sales</div>
              </div>
            </div>
            <div className="text-xs text-text-muted mt-4">
              Member since {formatRelativeTime(user.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <section>
        <h2 className="font-display text-xl mb-4">
          Listings ({activeListings})
        </h2>

        {listings.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-muted">
              This seller doesn&apos;t have any active listings yet.
            </p>
          </div>
        ) : (
          <ListingGrid
            listings={listings.map((listing) => ({
              ...listing,
              _count: {
                votes: listing._count.votes,
                comments: listing._count.comments,
              },
            }))}
          />
        )}
      </section>
    </div>
  )
}
