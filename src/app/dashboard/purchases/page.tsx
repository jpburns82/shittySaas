import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'My Purchases',
}

export default async function DashboardPurchasesPage() {
  const session = await auth()

  const purchases = await prisma.purchase.findMany({
    where: {
      buyerId: session!.user.id,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          title: true,
          slug: true,
          deliveryMethod: true,
          thumbnailUrl: true,
          deletedAt: true,
          status: true,
        },
      },
      seller: { select: { username: true } },
    },
  })

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

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">My Purchases</h1>

      {purchases.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-display text-xl mb-2">No purchases yet</p>
          <p className="text-text-muted mb-6">
            When you buy a listing, it will appear here.
          </p>
          <Link href="/listings">
            <Button variant="primary">Browse Listings</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="card flex gap-4">
              {/* Thumbnail */}
              <div className="w-24 h-24 bg-btn-bg border border-border-dark flex items-center justify-center">
                {purchase.listing.thumbnailUrl ? (
                  <img
                    src={purchase.listing.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-text-muted">📦</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/listing/${purchase.listing.slug}`} className="font-medium">
                        {purchase.listing.title}
                      </Link>
                      {(purchase.listing.deletedAt || purchase.listing.status === 'REMOVED') && (
                        <Badge variant="default">No longer available</Badge>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">
                      by @{purchase.seller.username} · {formatDate(purchase.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{formatPrice(purchase.amountPaidCents)}</div>
                    <Badge variant={statusVariant(purchase.status)}>{purchase.status}</Badge>
                  </div>
                </div>

                {/* Delivery status */}
                {purchase.status === 'COMPLETED' && (
                  <div className="mt-3 pt-3 border-t border-border-light">
                    {/* Instant downloads are always available after purchase */}
                    {purchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD' ? (
                      <div className="text-accent-green text-sm flex items-center gap-2">
                        <span>✓ Ready for download</span>
                        <Link href={`/download/${purchase.id}`} className="btn btn-primary text-xs py-1 px-2">
                          Download Files
                        </Link>
                      </div>
                    ) : purchase.deliveryStatus === 'CONFIRMED' ||
                      purchase.deliveryStatus === 'AUTO_COMPLETED' ? (
                      <div className="text-accent-green text-sm">
                        ✓ Delivered
                      </div>
                    ) : purchase.deliveryStatus === 'DELIVERED' ? (
                      <div className="text-sm">
                        <span className="text-accent-blue">Seller marked as delivered</span>
                        <button className="ml-4 btn-link text-sm">Confirm Receipt</button>
                      </div>
                    ) : (
                      <div className="text-text-muted text-sm">
                        ⏳ Awaiting delivery from seller
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
