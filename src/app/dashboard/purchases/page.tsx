import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { PurchaseCard } from '@/components/purchases/purchase-card'
import { BuyerTierBadge } from '@/components/ui/badges/buyer-tier-badge'
import { getSpendStatus } from '@/lib/buyer-limits'

export const metadata = {
  title: 'My Purchases',
}

export default async function DashboardPurchasesPage() {
  const session = await auth()

  const [purchases, user, spendStatus] = await Promise.all([
    prisma.purchase.findMany({
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
        seller: { select: { username: true, sellerTier: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { buyerTier: true },
    }),
    getSpendStatus(session!.user.id),
  ])

  // Transform purchases to include required fields with defaults
  const purchasesWithDefaults = purchases.map((p) => ({
    ...p,
    escrowStatus: p.escrowStatus || null,
    escrowExpiresAt: p.escrowExpiresAt || null,
    downloadCount: p.downloadCount || 0,
    maxDownloads: p.maxDownloads || 10,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">My Purchases</h1>
        {user && (
          <div className="flex items-center gap-3">
            <BuyerTierBadge tier={user.buyerTier} size="sm" />
            <span className="text-xs text-text-muted">
              ${(spendStatus.remaining / 100).toFixed(0)} remaining today
            </span>
          </div>
        )}
      </div>

      {purchasesWithDefaults.length === 0 ? (
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
          {purchasesWithDefaults.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  )
}
