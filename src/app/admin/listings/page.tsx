'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'

type Listing = {
  id: string
  title: string
  slug: string
  status: string
  priceCents: number
  priceType: string
  createdAt: string
  seller: { username: string; email: string }
}

export default function AdminListingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get('status') || 'all'

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [statusFilter])

  const fetchListings = async () => {
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
  }

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
                ? 'bg-text-primary text-bg-primary border-text-primary'
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
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <Link href={`/listing/${listing.slug}`} className="font-medium">
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
                      : formatPrice(listing.priceCents)}
                  </td>
                  <td>
                    <Badge variant={statusVariant(listing.status)}>{listing.status}</Badge>
                  </td>
                  <td className="text-text-muted">{formatDate(new Date(listing.createdAt))}</td>
                  <td>
                    <div className="flex gap-2">
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
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => updateStatus(listing.id, 'REJECTED')}
                        >
                          Remove
                        </Button>
                      )}
                      {listing.status === 'REJECTED' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(listing.id, 'ACTIVE')}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
