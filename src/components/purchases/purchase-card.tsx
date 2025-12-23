'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { EscrowStatus } from '@/components/ui/escrow-status'
import { DownloadCounter } from '@/components/ui/download-counter'
import { ReportIssueModal } from '@/components/purchases/report-issue-modal'
import { SellerTierBadge } from '@/components/ui/badges/seller-tier-badge'

type SellerTier = 'NEW' | 'VERIFIED' | 'TRUSTED' | 'PRO'

interface PurchaseCardProps {
  purchase: {
    id: string
    status: string
    amountPaidCents: number
    deliveryStatus: string | null
    escrowStatus: string | null
    escrowExpiresAt: Date | null
    downloadCount: number
    maxDownloads: number
    createdAt: Date
    listing: {
      title: string
      slug: string
      deliveryMethod: string
      thumbnailUrl: string | null
      deletedAt: Date | null
      status: string
    }
    seller: {
      username: string
      sellerTier: SellerTier
    }
  }
  onDisputeSuccess?: () => void
}

export function PurchaseCard({ purchase, onDisputeSuccess }: PurchaseCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const statusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'green'
      case 'PENDING':
        return 'yellow'
      case 'REFUNDED':
        return 'blue'
      default:
        return 'red'
    }
  }

  const canDispute = Boolean(
    purchase.status === 'COMPLETED' &&
    purchase.escrowStatus === 'HOLDING' &&
    purchase.escrowExpiresAt &&
    new Date(purchase.escrowExpiresAt) > new Date()
  )

  return (
    <>
      <div className="card flex gap-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 bg-btn-bg border border-border-dark flex items-center justify-center flex-shrink-0">
          {purchase.listing.thumbnailUrl ? (
            <Image
              src={purchase.listing.thumbnailUrl}
              alt=""
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-text-muted">📦</span>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/listing/${purchase.listing.slug}`} className="font-medium truncate">
                  {purchase.listing.title}
                </Link>
                {(purchase.listing.deletedAt || purchase.listing.status === 'REMOVED') && (
                  <Badge variant="default">No longer available</Badge>
                )}
              </div>
              <div className="text-sm text-text-muted flex items-center gap-2">
                <span>by @{purchase.seller.username}</span>
                <SellerTierBadge tier={purchase.seller.sellerTier} size="sm" />
                <span>· {formatDate(purchase.createdAt)}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono">{formatPrice(purchase.amountPaidCents)}</div>
              <Badge variant={statusVariant(purchase.status)}>{purchase.status}</Badge>
            </div>
          </div>

          {/* Delivery status */}
          {purchase.status === 'COMPLETED' && (
            <div className="mt-3 pt-3 border-t border-border-light space-y-3">
              {/* Escrow Status */}
              {purchase.escrowStatus && purchase.escrowStatus !== 'RELEASED' && (
                <EscrowStatus
                  status={purchase.escrowStatus as 'HOLDING' | 'DISPUTED' | 'RELEASED' | 'REFUNDED'}
                  expiresAt={purchase.escrowExpiresAt}
                  canDispute={canDispute}
                  onDisputeClick={() => setReportModalOpen(true)}
                />
              )}

              {/* Instant downloads */}
              {purchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD' ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="text-accent-green text-sm flex items-center gap-2">
                    <span>✓ Ready for download</span>
                    <Link
                      href={`/download/${purchase.id}`}
                      className="btn btn-primary text-xs py-1 px-2"
                    >
                      Download Files
                    </Link>
                  </div>
                  <DownloadCounter used={purchase.downloadCount} max={purchase.maxDownloads} />
                </div>
              ) : purchase.deliveryStatus === 'CONFIRMED' ||
                purchase.deliveryStatus === 'AUTO_COMPLETED' ? (
                <div className="text-accent-green text-sm">✓ Delivered</div>
              ) : purchase.deliveryStatus === 'DELIVERED' ? (
                <div className="text-sm">
                  <span className="text-accent-blue">Seller marked as delivered</span>
                  <button className="ml-4 btn-link text-sm">Confirm Receipt</button>
                </div>
              ) : (
                <div className="text-text-muted text-sm">⏳ Awaiting delivery from seller</div>
              )}

              {/* Report Issue Button - show only if not already disputed */}
              {canDispute && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="text-sm text-text-muted hover:text-accent-yellow transition-colors"
                >
                  Report an issue
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        purchaseId={purchase.id}
        listingTitle={purchase.listing.title}
        onSuccess={onDisputeSuccess}
      />
    </>
  )
}
