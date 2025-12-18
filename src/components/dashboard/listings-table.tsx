'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PriceBadge } from '@/components/listings/price-badge'
import { Button } from '@/components/ui/button'
import { Badge, FeaturedBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatRelativeTime, formatPrice } from '@/lib/utils'
import { FEATURED_DURATION_OPTIONS, FeaturedDurationKey } from '@/lib/constants'

type Listing = {
  id: string
  title: string
  slug: string
  priceType: string
  priceInCents: number | null
  status: string
  featured: boolean
  featuredUntil: Date | null
  createdAt: Date
  category: { name: string }
  _count: { purchases: number }
}

interface ListingsTableProps {
  listings: Listing[]
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'green'
    case 'DRAFT':
      return 'yellow'
    case 'SOLD':
    case 'ARCHIVED':
      return 'default'
    default:
      return 'red'
  }
}

export function ListingsTable({ listings }: ListingsTableProps) {
  const searchParams = useSearchParams()
  const featuredParam = searchParams.get('featured')

  // Show success message if came back from successful checkout
  const [showSuccess, setShowSuccess] = useState(featuredParam === 'success')

  // Promote modal state
  const [promoteModal, setPromoteModal] = useState<{ open: boolean; listing: Listing | null }>({
    open: false,
    listing: null,
  })
  const [selectedDuration, setSelectedDuration] = useState<FeaturedDurationKey>('WEEK_2')
  const [promoteLoading, setPromoteLoading] = useState(false)

  const isCurrentlyFeatured = (listing: Listing) => {
    if (!listing.featured) return false
    if (!listing.featuredUntil) return true // Indefinite
    return new Date(listing.featuredUntil) > new Date()
  }

  const handlePromote = async () => {
    if (!promoteModal.listing) return
    setPromoteLoading(true)
    try {
      const res = await fetch('/api/stripe/featured-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: promoteModal.listing.id,
          duration: selectedDuration,
        }),
      })
      const data = await res.json()
      if (data.success && data.data.url) {
        window.location.href = data.data.url
      } else {
        console.error('Failed to create checkout:', data.error)
      }
    } catch (error) {
      console.error('Failed to create checkout:', error)
    } finally {
      setPromoteLoading(false)
    }
  }

  return (
    <>
      {/* Success Message */}
      {showSuccess && (
        <div className="card bg-accent-green/10 border-accent-green mb-6">
          <div className="flex items-center justify-between">
            <p className="text-accent-green">
              Your listing is now featured! It will appear at the top of search results.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-text-muted hover:text-text-primary"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Price</th>
              <th>Category</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Sales</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td>
                  <Link href={`/listing/${listing.slug}`} className="font-medium hover:underline">
                    {listing.title}
                  </Link>
                </td>
                <td>
                  <PriceBadge
                    priceType={listing.priceType}
                    priceInCents={listing.priceInCents}
                    size="sm"
                  />
                </td>
                <td className="text-text-muted">{listing.category.name}</td>
                <td>
                  <Badge variant={statusVariant(listing.status)}>{listing.status}</Badge>
                </td>
                <td>
                  {isCurrentlyFeatured(listing) ? (
                    <div className="flex flex-col gap-1">
                      <FeaturedBadge />
                      {listing.featuredUntil && (
                        <span className="text-xs text-text-muted">
                          Ends {formatRelativeTime(new Date(listing.featuredUntil))}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="font-mono">{listing._count.purchases}</td>
                <td className="text-text-muted">{formatRelativeTime(listing.createdAt)}</td>
                <td>
                  <div className="flex gap-2 items-center">
                    {listing.status === 'ACTIVE' && !isCurrentlyFeatured(listing) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setPromoteModal({ open: true, listing })}
                      >
                        Promote
                      </Button>
                    )}
                    <Link href={`/sell/${listing.id}/edit`} className="text-sm hover:underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Promote Modal */}
      <Modal
        isOpen={promoteModal.open}
        onClose={() => {
          setPromoteModal({ open: false, listing: null })
          setSelectedDuration('WEEK_2')
        }}
        title="Promote Your Listing"
      >
        {promoteModal.listing && (
          <div className="space-y-6">
            <p className="text-text-muted">
              Feature <strong>&ldquo;{promoteModal.listing.title}&rdquo;</strong> to increase visibility and
              attract more buyers.
            </p>

            {/* Benefits */}
            <div className="p-4 bg-bg-accent border border-border-dark">
              <p className="font-medium mb-2">Featured listings get:</p>
              <ul className="text-sm text-text-muted space-y-1">
                <li>- Displayed at the top of search results</li>
                <li>- Featured badge on your listing</li>
                <li>- Higher visibility = more potential sales</li>
              </ul>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Duration</label>
              <div className="space-y-2">
                {(Object.keys(FEATURED_DURATION_OPTIONS) as FeaturedDurationKey[]).map((key) => {
                  const option = FEATURED_DURATION_OPTIONS[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDuration(key)}
                      className={`w-full p-4 border text-left flex items-center justify-between ${
                        selectedDuration === key
                          ? 'border-accent-neon-green bg-accent-neon-green/10'
                          : 'border-border-dark hover:bg-bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{option.label}</span>
                        {'badge' in option && (
                          <Badge variant="green">{option.badge}</Badge>
                        )}
                      </div>
                      <span className="font-mono">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-bg-accent border border-border-dark">
              <span className="font-medium">Total</span>
              <span className="font-mono text-lg">
                {formatPrice(FEATURED_DURATION_OPTIONS[selectedDuration].priceInCents)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="default"
                onClick={() => {
                  setPromoteModal({ open: false, listing: null })
                  setSelectedDuration('WEEK_2')
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePromote} disabled={promoteLoading}>
                {promoteLoading ? 'Processing...' : 'Promote Now'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
