'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge, FeaturedBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatPrice, formatDate, formatRelativeTime } from '@/lib/utils'

type Listing = {
  id: string
  title: string
  slug: string
  status: string
  priceInCents: number
  priceType: string
  featured: boolean
  featuredUntil: string | null
  createdAt: string
  seller: { username: string; email: string }
}

const DURATION_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: 'indefinite', label: 'Indefinite' },
]

export default function AdminListingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get('status') || 'all'

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // Feature modal state
  const [featureModal, setFeatureModal] = useState<{ open: boolean; listing: Listing | null }>({
    open: false,
    listing: null,
  })
  const [featureDuration, setFeatureDuration] = useState('7')
  const [featureLoading, setFeatureLoading] = useState(false)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; listing: Listing | null }>({
    open: false,
    listing: null,
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [forceDelete, setForceDelete] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/listings?${params}`)
      const data = await res.json()
      if (data.success) {
        setListings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const updateStatus = async (listingId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error('Failed to update listing:', error)
    }
  }

  const handleFeature = async () => {
    if (!featureModal.listing) return
    setFeatureLoading(true)
    try {
      const res = await fetch(`/api/admin/listings/${featureModal.listing.id}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feature', duration: featureDuration }),
      })
      if (res.ok) {
        setFeatureModal({ open: false, listing: null })
        setFeatureDuration('7')
        fetchListings()
      }
    } catch (error) {
      console.error('Failed to feature listing:', error)
    } finally {
      setFeatureLoading(false)
    }
  }

  const handleUnfeature = async (listingId: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfeature' }),
      })
      if (res.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error('Failed to unfeature listing:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.listing) return
    setDeleteLoading(true)
    try {
      const url = forceDelete
        ? `/api/admin/listings/${deleteModal.listing.id}?force=true`
        : `/api/admin/listings/${deleteModal.listing.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        setDeleteModal({ open: false, listing: null })
        setForceDelete(false)
        fetchListings()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Failed to delete listing:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green'
      case 'PENDING':
        return 'yellow'
      case 'REJECTED':
        return 'red'
      case 'SOLD':
        return 'blue'
      default:
        return 'default'
    }
  }

  const isExpired = (featuredUntil: string | null) => {
    if (!featuredUntil) return false
    return new Date(featuredUntil) < new Date()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Manage Listings</h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'PENDING', 'ACTIVE', 'REJECTED', 'SOLD', 'DRAFT'].map((status) => (
          <button
            key={status}
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              if (status === 'all') {
                params.delete('status')
              } else {
                params.set('status', status)
              }
              router.push(`/admin/listings?${params}`)
            }}
            className={`px-3 py-1 text-sm border ${
              statusFilter === status || (status === 'all' && !searchParams.get('status'))
                ? 'bg-accent-electric/20 text-accent-electric border-accent-electric'
                : 'border-border-dark hover:bg-bg-accent'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Listings Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No listings found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Created</th>
                <th>Actions</th>
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
                    <div>@{listing.seller.username}</div>
                    <div className="text-xs text-text-muted">{listing.seller.email}</div>
                  </td>
                  <td className="font-mono">
                    {listing.priceType === 'FREE'
                      ? 'Free'
                      : listing.priceType === 'CONTACT'
                      ? 'Contact'
                      : formatPrice(listing.priceInCents)}
                  </td>
                  <td>
                    <Badge variant={statusVariant(listing.status)}>{listing.status}</Badge>
                  </td>
                  <td>
                    {listing.featured && !isExpired(listing.featuredUntil) ? (
                      <div className="flex flex-col gap-1">
                        <FeaturedBadge />
                        {listing.featuredUntil && (
                          <span className="text-xs text-text-muted">
                            Ends {formatRelativeTime(new Date(listing.featuredUntil))}
                          </span>
                        )}
                        {!listing.featuredUntil && (
                          <span className="text-xs text-text-muted">Indefinite</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="text-text-muted">{formatDate(new Date(listing.createdAt))}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {listing.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => updateStatus(listing.id, 'ACTIVE')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(listing.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {listing.status === 'ACTIVE' && (
                        <>
                          {listing.featured && !isExpired(listing.featuredUntil) ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUnfeature(listing.id)}
                            >
                              Unfeature
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setFeatureModal({ open: true, listing })}
                            >
                              Feature
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(listing.id, 'REJECTED')}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                      {listing.status === 'REJECTED' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(listing.id, 'ACTIVE')}
                        >
                          Restore
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteModal({ open: true, listing })}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feature Modal */}
      <Modal
        isOpen={featureModal.open}
        onClose={() => {
          setFeatureModal({ open: false, listing: null })
          setFeatureDuration('7')
        }}
        title="Feature Listing"
      >
        {featureModal.listing && (
          <div className="space-y-4">
            <p className="text-text-muted">
              Feature <strong>&ldquo;{featureModal.listing.title}&rdquo;</strong> to display it prominently on
              the homepage and at the top of search results.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFeatureDuration(opt.value)}
                    className={`px-4 py-2 border ${
                      featureDuration === opt.value
                        ? 'bg-accent-electric/20 text-accent-electric border-accent-electric'
                        : 'border-border-dark hover:bg-bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-text-muted">
              Note: This is a promotional feature - no payment is involved.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="default"
                onClick={() => {
                  setFeatureModal({ open: false, listing: null })
                  setFeatureDuration('7')
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleFeature} disabled={featureLoading}>
                {featureLoading ? 'Featuring...' : 'Feature Listing'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => {
          setDeleteModal({ open: false, listing: null })
          setForceDelete(false)
        }}
        title="Delete Listing"
      >
        {deleteModal.listing && (
          <div className="space-y-4">
            <p className="text-text-muted">
              Are you sure you want to <strong className="text-red-500">permanently delete</strong>{' '}
              <strong>&ldquo;{deleteModal.listing.title}&rdquo;</strong>?
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-3 text-sm">
              <p className="text-red-400 font-medium mb-1">Warning: This action cannot be undone!</p>
              <ul className="text-text-muted list-disc list-inside space-y-1">
                <li>The listing will be permanently removed from the database</li>
                <li>All associated files will be deleted from storage</li>
                <li>Buyers who purchased this listing may lose access</li>
              </ul>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-text-muted">
                Force delete (even if listing has purchases)
              </span>
            </label>
            <div className="flex gap-2 justify-end">
              <Button
                variant="default"
                onClick={() => {
                  setDeleteModal({ open: false, listing: null })
                  setForceDelete(false)
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
