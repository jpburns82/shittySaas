'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime } from '@/lib/utils'
import { PriceBadge } from './price-badge'
import { TechStackTags } from './tech-stack-tags'
import { FeaturedBadge } from '../ui/badge'
import { SellerTierBadge } from '../ui/badges/seller-tier-badge'
import { GitHubBadge } from '../ui/badges/github-badge'
import type { ListingCard as ListingCardType } from '@/types/listing'

interface ListingCardProps {
  listing: ListingCardType
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listing/${listing.slug}`} className="block group">
      <article className="listing-card hover:border-accent-cyan transition-colors cursor-pointer">
        {/* Featured marker */}
        {listing.featured && (
          <div className="mb-2">
            <FeaturedBadge />
          </div>
        )}

        {/* Thumbnail */}
        {listing.thumbnailUrl && (
          <div className="aspect-video relative mb-3 rounded overflow-hidden bg-bg-grave">
            <Image
              src={listing.thumbnailUrl}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>
        )}

        {/* Title */}
        <h3 className="listing-card-title group-hover:text-accent-cyan transition-colors">{listing.title}</h3>

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
          <span className="flex items-center gap-1">
            <span>⚡</span>
            <span className="font-mono">{listing.upvoteCount ?? 0}</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span>⚰️</span>
            <span className="font-mono">{listing.downvoteCount ?? 0}</span>
          </span>
          <span>·</span>
          <span>{formatRelativeTime(listing.createdAt)}</span>
        </div>

        {/* Seller */}
        <div className="text-xs text-text-muted mt-2 flex items-center gap-1.5">
          <span>by</span>
          <span
            className="hover:underline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/user/${listing.seller.username}`
            }}
          >
            @{listing.seller.username}
          </span>
          {listing.seller.sellerTier && (
            <SellerTierBadge tier={listing.seller.sellerTier} size="sm" />
          )}
          {listing.seller.githubVerifiedAt && listing.repoUrl?.includes('github.com') && (
            <GitHubBadge verified username={listing.seller.githubUsername ?? undefined} />
          )}
        </div>
      </article>
    </Link>
  )
}
