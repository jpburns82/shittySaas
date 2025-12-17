import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { PriceBadge } from './price-badge'
import { TechStackTags } from './tech-stack-tags'
import { FeaturedBadge, VerifiedBadge } from '../ui/badge'
import type { ListingCard as ListingCardType } from '@/types/listing'

interface ListingCardProps {
  listing: ListingCardType
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="listing-card">
      {/* Featured marker */}
      {listing.featured && (
        <div className="mb-2">
          <FeaturedBadge />
        </div>
      )}

      {/* Title */}
      <Link href={`/listing/${listing.slug}`}>
        <h3 className="listing-card-title">{listing.title}</h3>
      </Link>

      {/* Description */}
      <p className="listing-card-desc">{listing.shortDescription}</p>

      {/* Tech stack */}
      {listing.techStack.length > 0 && (
        <TechStackTags tags={listing.techStack.slice(0, 4)} />
      )}

      {/* Meta line */}
      <div className="listing-card-meta flex items-center gap-2 flex-wrap">
        <PriceBadge priceType={listing.priceType} priceInCents={listing.priceInCents} />
        <span>·</span>
        <span>{listing.category.name}</span>
        <span>·</span>
        <span>👍 {listing.voteScore}</span>
        <span>·</span>
        <span>{formatRelativeTime(listing.createdAt)}</span>
      </div>

      {/* Seller */}
      <div className="text-xs text-text-muted mt-2">
        by{' '}
        <Link href={`/user/${listing.seller.username}`} className="hover:underline">
          @{listing.seller.username}
        </Link>
        {listing.seller.isVerifiedSeller && (
          <span className="ml-1 text-accent-green">✓</span>
        )}
      </div>
    </article>
  )
}
