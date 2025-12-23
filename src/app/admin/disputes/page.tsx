'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { SellerTierBadge } from '@/components/ui/badges/seller-tier-badge'
import { formatDate, formatRelativeTime, formatPrice } from '@/lib/utils'

type SellerTier = 'NEW' | 'VERIFIED' | 'TRUSTED' | 'PRO'

type Dispute = {
  id: string
  listing: {
    id: string
    title: string
    slug: string
  }
  buyer: {
    id: string
    username: string
    email: string
  } | null
  seller: {
    id: string
    username: string
    email: string
    sellerTier: SellerTier
    totalDisputes: number
    disputeRate: number
  }
  amountPaidCents: number
  sellerAmountCents: number
  escrowStatus: 'HOLDING' | 'DISPUTED' | 'RELEASED' | 'REFUNDED'
  disputedAt: string
  disputeReason: string | null
  disputeNotes: string | null
  resolvedAt: string | null
  resolvedBy: string | null
  resolution: string | null
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

const DISPUTE_REASONS: Record<string, string> = {
  FILES_EMPTY: 'Files were empty or corrupted',
  NOT_AS_DESCRIBED: 'Not as described',
  SELLER_UNRESPONSIVE: 'Seller unresponsive',
  SUSPECTED_STOLEN: 'Suspected stolen code',
  MALWARE: 'Malware or malicious code',
  OTHER: 'Other reason',
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All Disputes' },
  { value: 'DISPUTED', label: 'Pending' },
  { value: 'RESOLVED', label: 'Resolved' },
]

const escrowStatusVariant = (status: string) => {
  switch (status) {
    case 'DISPUTED':
      return 'yellow'
    case 'RELEASED':
      return 'green'
    case 'REFUNDED':
      return 'blue'
    case 'HOLDING':
      return 'default'
    default:
      return 'default'
  }
}

export default function AdminDisputesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') || 'DISPUTED'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{ open: boolean; dispute: Dispute | null }>({
    open: false,
    dispute: null,
  })

  // Resolution modal state
  const [resolutionModal, setResolutionModal] = useState<{
    open: boolean
    dispute: Dispute | null
    resolution: 'REFUND_BUYER' | 'RELEASE_TO_SELLER' | null
  }>({ open: false, dispute: null, resolution: null })
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionLoading, setResolutionLoading] = useState(false)

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', statusFilter)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/disputes?${params}`)
      const data = await res.json()
      if (data.success) {
        setDisputes(data.data.disputes)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, currentPage])

  useEffect(() => {
    fetchDisputes()
  }, [fetchDisputes])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    params.delete('page')
    router.push(`/admin/disputes?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/disputes?${params}`)
  }

  const openDetail = (dispute: Dispute) => {
    setDetailModal({ open: true, dispute })
  }

  const handleResolve = async () => {
    if (!resolutionModal.dispute || !resolutionModal.resolution) return
    setResolutionLoading(true)
    try {
      const res = await fetch(`/api/admin/disputes/${resolutionModal.dispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: resolutionModal.resolution,
          notes: resolutionNotes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResolutionModal({ open: false, dispute: null, resolution: null })
        setResolutionNotes('')
        setDetailModal({ open: false, dispute: null })
        fetchDisputes()
      } else {
        alert(data.error || 'Failed to resolve dispute')
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error)
      alert('Failed to resolve dispute')
    } finally {
      setResolutionLoading(false)
    }
  }

  const pendingCount = disputes.filter((d) => d.escrowStatus === 'DISPUTED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl">Dispute Management</h1>
          {statusFilter === 'DISPUTED' && pendingCount > 0 && (
            <Badge variant="yellow">{pendingCount} pending</Badge>
          )}
        </div>
        {pagination && (
          <span className="text-text-muted text-sm">{pagination.total} total disputes</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="input"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No disputes found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Listing</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td className="text-text-muted text-sm whitespace-nowrap">
                    {formatRelativeTime(new Date(dispute.disputedAt))}
                  </td>
                  <td>
                    <Link
                      href={`/listing/${dispute.listing.slug}`}
                      className="hover:underline text-sm truncate max-w-[180px] block"
                    >
                      {dispute.listing.title}
                    </Link>
                  </td>
                  <td>
                    {dispute.buyer ? (
                      <Link
                        href={`/user/${dispute.buyer.username}`}
                        className="hover:underline text-sm"
                      >
                        @{dispute.buyer.username}
                      </Link>
                    ) : (
                      <span className="text-text-muted text-sm">Guest</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${dispute.seller.username}`}
                        className="hover:underline text-sm"
                      >
                        @{dispute.seller.username}
                      </Link>
                      <SellerTierBadge tier={dispute.seller.sellerTier} size="sm" />
                    </div>
                  </td>
                  <td className="text-sm font-mono">
                    {formatPrice(dispute.amountPaidCents)}
                  </td>
                  <td>
                    <span className="text-sm">
                      {DISPUTE_REASONS[dispute.disputeReason || ''] || dispute.disputeReason || '-'}
                    </span>
                  </td>
                  <td>
                    <Badge variant={escrowStatusVariant(dispute.escrowStatus)}>
                      {dispute.escrowStatus}
                    </Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="default" onClick={() => openDetail(dispute)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            size="sm"
            variant="default"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="self-center text-sm text-text-muted">
            Page {currentPage} of {pagination.pages}
          </span>
          <Button
            size="sm"
            variant="default"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dispute Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, dispute: null })}
        title="Dispute Details"
        size="lg"
      >
        {detailModal.dispute && (
          <div className="space-y-6">
            {/* Dispute Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted text-sm">Status</span>
                <div className="mt-1">
                  <Badge variant={escrowStatusVariant(detailModal.dispute.escrowStatus)}>
                    {detailModal.dispute.escrowStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Amount</span>
                <div className="mt-1 font-mono font-medium">
                  {formatPrice(detailModal.dispute.amountPaidCents)}
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Reason</span>
                <div className="mt-1 font-medium">
                  {DISPUTE_REASONS[detailModal.dispute.disputeReason || ''] ||
                    detailModal.dispute.disputeReason ||
                    'Not specified'}
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Disputed</span>
                <div className="mt-1">{formatDate(new Date(detailModal.dispute.disputedAt))}</div>
              </div>
            </div>

            {/* Dispute Notes */}
            {detailModal.dispute.disputeNotes && (
              <div>
                <span className="text-text-muted text-sm">Buyer&apos;s Notes</span>
                <div className="mt-1 p-3 bg-bg-accent border border-border-dark">
                  {detailModal.dispute.disputeNotes}
                </div>
              </div>
            )}

            {/* Listing Info */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Listing</span>
              <div className="mt-2 p-3 bg-bg-accent border border-border-dark">
                <Link
                  href={`/listing/${detailModal.dispute.listing.slug}`}
                  className="font-medium hover:underline"
                >
                  {detailModal.dispute.listing.title}
                </Link>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Buyer</span>
              <div className="mt-2 flex items-center justify-between">
                {detailModal.dispute.buyer ? (
                  <>
                    <Link
                      href={`/user/${detailModal.dispute.buyer.username}`}
                      className="font-medium hover:underline"
                    >
                      @{detailModal.dispute.buyer.username}
                    </Link>
                    <span className="text-sm text-text-muted">
                      {detailModal.dispute.buyer.email}
                    </span>
                  </>
                ) : (
                  <span className="text-text-muted">Guest Buyer</span>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Seller</span>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/user/${detailModal.dispute.seller.username}`}
                    className="font-medium hover:underline"
                  >
                    @{detailModal.dispute.seller.username}
                  </Link>
                  <SellerTierBadge tier={detailModal.dispute.seller.sellerTier} size="sm" />
                </div>
                <span className="text-sm text-text-muted">
                  {detailModal.dispute.seller.email}
                </span>
              </div>
              <div className="mt-2 text-sm text-text-muted">
                {detailModal.dispute.seller.totalDisputes} total disputes
                {detailModal.dispute.seller.disputeRate > 0 && (
                  <span className="ml-2 text-accent-yellow">
                    ({(detailModal.dispute.seller.disputeRate * 100).toFixed(1)}% dispute rate)
                  </span>
                )}
              </div>
            </div>

            {/* Resolution (if resolved) */}
            {detailModal.dispute.resolvedAt && (
              <div className="border-t border-border-dark pt-4">
                <span className="text-text-muted text-sm">Resolution</span>
                <div className="mt-1 p-3 bg-bg-accent border border-border-dark">
                  {detailModal.dispute.resolution}
                </div>
                <div className="mt-2 text-sm text-text-muted">
                  Resolved {formatDate(new Date(detailModal.dispute.resolvedAt))}
                </div>
              </div>
            )}

            {/* Actions */}
            {detailModal.dispute.escrowStatus === 'DISPUTED' && (
              <div className="border-t border-border-dark pt-4 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() =>
                    setResolutionModal({
                      open: true,
                      dispute: detailModal.dispute,
                      resolution: 'REFUND_BUYER',
                    })
                  }
                >
                  Refund Buyer
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    setResolutionModal({
                      open: true,
                      dispute: detailModal.dispute,
                      resolution: 'RELEASE_TO_SELLER',
                    })
                  }
                >
                  Release to Seller
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Resolution Confirmation Modal */}
      <Modal
        isOpen={resolutionModal.open}
        onClose={() => {
          setResolutionModal({ open: false, dispute: null, resolution: null })
          setResolutionNotes('')
        }}
        title={
          resolutionModal.resolution === 'REFUND_BUYER'
            ? 'Refund Buyer'
            : 'Release to Seller'
        }
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            {resolutionModal.resolution === 'REFUND_BUYER' ? (
              <>
                This will refund{' '}
                <span className="font-mono font-medium text-text-primary">
                  {formatPrice(resolutionModal.dispute?.amountPaidCents || 0)}
                </span>{' '}
                to the buyer and close this dispute.
              </>
            ) : (
              <>
                This will release{' '}
                <span className="font-mono font-medium text-text-primary">
                  {formatPrice(resolutionModal.dispute?.sellerAmountCents || 0)}
                </span>{' '}
                to the seller and close this dispute.
              </>
            )}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="input w-full h-24"
              placeholder="Reason for this decision..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="default"
              onClick={() => {
                setResolutionModal({ open: false, dispute: null, resolution: null })
                setResolutionNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={resolutionModal.resolution === 'REFUND_BUYER' ? 'danger' : 'primary'}
              onClick={handleResolve}
              loading={resolutionLoading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
