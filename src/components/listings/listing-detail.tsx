import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { PriceBadge } from './price-badge'
import { TechStackTags } from './tech-stack-tags'
import { VoteButtons } from './vote-buttons'
import { VerifiedBadge, FeaturedBadge } from '../ui/badge'
import { SellerTierBadge } from '../ui/badges/seller-tier-badge'
import { ProtectedBadge } from '../ui/badges/protected-badge'
import { Button } from '../ui/button'
import { ImageGallery } from '../ui/image-gallery'
import type { ListingDetail as ListingDetailType } from '@/types/listing'

interface ListingDetailProps {
  listing: ListingDetailType
  isOwner?: boolean
  currentUserVote?: 1 | -1 | null
}

export function ListingDetail({ listing, isOwner, currentUserVote }: ListingDetailProps) {
  return (
    <article className="space-y-6">
      {/* Header */}
      <header className="border-b border-border-dark pb-4">
        {listing.featured && (
          <div className="mb-2">
            <FeaturedBadge />
          </div>
        )}

        <h1 className="font-display text-2xl mb-2">{listing.title}</h1>

        <div className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
          <span>
            by{' '}
            <Link href={`/user/${listing.seller.username}`} className="text-link">
              @{listing.seller.username}
            </Link>
          </span>
          {listing.seller.isVerifiedSeller && <VerifiedBadge />}
          <span>·</span>
          <span>Listed {formatRelativeTime(listing.createdAt)}</span>
          <span>·</span>
          <span className="view-counter">{listing.viewCount.toLocaleString()} views</span>
        </div>
      </header>

      {/* Thumbnail */}
      {listing.thumbnailUrl && (
        <div className="aspect-video relative mb-6 rounded-lg overflow-hidden bg-bg-grave max-w-2xl">
          <Image
            src={listing.thumbnailUrl}
            alt={listing.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <section>
            <h2 className="font-display text-lg border-b border-border-light pb-2 mb-4">
              Description
            </h2>
            <div className="prose prose-sm max-w-none">
              {/* In real app, render markdown */}
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </div>
          </section>

          {/* Links */}
          {(listing.liveUrl || listing.repoUrl || listing.videoUrl) && (
            <section>
              <h2 className="font-display text-lg border-b border-border-light pb-2 mb-4">
                Links
              </h2>
              <ul className="space-y-2">
                {listing.liveUrl && (
                  <li>
                    🔗 <a href={listing.liveUrl} target="_blank" rel="noopener noreferrer">
                      Live Demo
                    </a>
                  </li>
                )}
                {listing.repoUrl && (
                  <li>
                    📁 <a href={listing.repoUrl} target="_blank" rel="noopener noreferrer">
                      Repository
                    </a>
                  </li>
                )}
                {listing.videoUrl && (
                  <li>
                    🎬 <a href={listing.videoUrl} target="_blank" rel="noopener noreferrer">
                      Video
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Tech Stack */}
          {listing.techStack.length > 0 && (
            <section>
              <h2 className="font-display text-lg border-b border-border-light pb-2 mb-4">
                Tech Stack
              </h2>
              <TechStackTags tags={listing.techStack} />
            </section>
          )}

          {/* Screenshots Gallery */}
          {listing.screenshots.length > 0 && (
            <section>
              <h2 className="font-display text-lg border-b border-border-light pb-2 mb-4">
                Screenshots
              </h2>
              <ImageGallery
                images={listing.screenshots}
                alt={listing.title}
              />
            </section>
          )}
        </div>

        {/* Sidebar (1 col) */}
        <aside className="space-y-4">
          {/* Price card */}
          <div className="card">
            <div className="text-2xl font-mono font-bold text-accent-green mb-2">
              <PriceBadge priceType={listing.priceType} priceInCents={listing.priceInCents} size="lg" />
            </div>
            {listing.priceType !== 'CONTACT' && (
              <div className="mb-4">
                <ProtectedBadge />
              </div>
            )}

            {isOwner ? (
              <Link href={`/sell/${listing.id}/edit`}>
                <Button variant="secondary" className="w-full">Edit Listing</Button>
              </Link>
            ) : listing.priceType === 'CONTACT' ? (
              <Link href={`/dashboard/messages?to=${listing.seller.username}&listing=${listing.id}`}>
                <Button variant="primary" className="w-full">
                  Contact Seller
                </Button>
              </Link>
            ) : (
              <Link href={`/listing/${listing.slug}/purchase`}>
                <Button variant="primary" className="w-full">
                  Buy Now
                </Button>
              </Link>
            )}

            {/* Delivery info */}
            <div className="mt-4 pt-4 border-t border-border-light text-sm">
              <div className="font-medium mb-2">Delivery</div>
              <p className="text-text-muted">
                {listing.deliveryMethod === 'INSTANT_DOWNLOAD'
                  ? '📦 Instant download after purchase'
                  : listing.deliveryMethod === 'REPOSITORY_ACCESS'
                    ? `📁 Repository access within ${listing.deliveryTimeframeDays || 1} day(s)`
                    : listing.deliveryMethod === 'MANUAL_TRANSFER'
                      ? `📧 Manual transfer within ${listing.deliveryTimeframeDays || 1} day(s)`
                      : `🌐 Domain transfer within ${listing.deliveryTimeframeDays || 7} day(s)`}
              </p>
            </div>
          </div>

          {/* What's included */}
          <div className="card">
            <h3 className="font-display text-base mb-3">What&apos;s Included</h3>
            <ul className="space-y-1 text-sm">
              {listing.includesSourceCode && <li>✓ Full source code</li>}
              {listing.includesDatabase && <li>✓ Database schema</li>}
              {listing.includesDocs && <li>✓ Documentation</li>}
              {listing.includesDeployGuide && <li>✓ Deployment guide</li>}
              {listing.includesSupport && (
                <li>✓ {listing.supportDays || 30} days email support</li>
              )}
              {listing.includesUpdates && <li>✓ Future updates</li>}
              {listing.includesCommercialLicense && <li>✓ Commercial license</li>}
              {listing.includesWhiteLabel && <li>✓ White-label rights</li>}
              {!listing.includesSourceCode && <li className="text-text-muted">✗ Source code</li>}
            </ul>
          </div>

          {/* Seller info */}
          <div className="card">
            <h3 className="font-display text-base mb-3">Seller</h3>
            <div className="flex items-start gap-3">
              {listing.seller.avatarUrl ? (
                <div className="w-12 h-12 relative rounded-full overflow-hidden">
                  <Image
                    src={listing.seller.avatarUrl}
                    alt={listing.seller.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-zinc-800 border border-border-dark flex items-center justify-center font-display text-lg">
                  {listing.seller.displayName?.[0] || listing.seller.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/user/${listing.seller.username}`} className="font-medium">
                    @{listing.seller.username}
                  </Link>
                  {listing.seller.sellerTier && (
                    <SellerTierBadge tier={listing.seller.sellerTier} size="sm" />
                  )}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Member since {formatDate(listing.seller.createdAt)}
                </div>
                <div className="text-xs text-text-muted">
                  {listing.seller._count.listings} listings · {listing.seller._count.sales} sold
                </div>
                {listing.seller.totalSales && listing.seller.totalSales > 0 && listing.seller.disputeRate !== undefined && listing.seller.disputeRate > 0 && (
                  <div className="text-xs text-accent-yellow mt-1">
                    {(listing.seller.disputeRate * 100).toFixed(1)}% dispute rate
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voting */}
          <div className="card">
            <h3 className="font-display text-base mb-3">Community</h3>
            <VoteButtons
              listingId={listing.id}
              initialCounts={{
                score: listing.voteScore ?? 0,
                upvotes: listing.upvoteCount ?? 0,
                downvotes: listing.downvoteCount ?? 0,
              }}
              initialUserVote={currentUserVote ?? null}
              sellerId={listing.sellerId}
            />
          </div>
        </aside>
      </div>
    </article>
  )
}
