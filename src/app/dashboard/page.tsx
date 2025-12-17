import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  // Fetch stats
  const [
    totalEarnings,
    totalSales,
    activeListings,
    pendingDeliveries,
    recentSales,
    recentMessages,
  ] = await Promise.all([
    // Total earnings
    prisma.purchase.aggregate({
      where: {
        sellerId: userId,
        status: 'COMPLETED',
      },
      _sum: { sellerAmountCents: true },
    }),
    // Total sales count
    prisma.purchase.count({
      where: {
        sellerId: userId,
        status: 'COMPLETED',
      },
    }),
    // Active listings count
    prisma.listing.count({
      where: {
        sellerId: userId,
        status: 'ACTIVE',
      },
    }),
    // Pending deliveries count
    prisma.purchase.count({
      where: {
        sellerId: userId,
        status: 'COMPLETED',
        deliveryStatus: 'PENDING',
      },
    }),
    // Recent sales
    prisma.purchase.findMany({
      where: {
        sellerId: userId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        listing: { select: { title: true, slug: true } },
        buyer: { select: { username: true } },
      },
    }),
    // Recent messages
    prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: { select: { username: true } },
        listing: { select: { title: true } },
      },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">
          Welcome back, @{session!.user.username}
        </h1>
        <Link href="/sell">
          <Button variant="primary">+ Create Listing</Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-2xl font-mono text-accent-green">
            {formatPrice(totalEarnings._sum.sellerAmountCents || 0)}
          </div>
          <div className="text-sm text-text-muted">Total Earnings</div>
        </div>
        <div className="card">
          <div className="text-2xl font-mono">{totalSales}</div>
          <div className="text-sm text-text-muted">Sales</div>
        </div>
        <div className="card">
          <div className="text-2xl font-mono">{activeListings}</div>
          <div className="text-sm text-text-muted">Active Listings</div>
        </div>
        <div className="card">
          <div className="text-2xl font-mono">
            {pendingDeliveries > 0 && (
              <span className="text-accent-yellow">{pendingDeliveries}</span>
            )}
            {pendingDeliveries === 0 && <span className="text-text-muted">0</span>}
          </div>
          <div className="text-sm text-text-muted">Pending Delivery</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Recent Sales</h2>
            <Link href="/dashboard/sales" className="text-sm">
              View All →
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-text-muted text-sm">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{sale.listing.title}</div>
                    <div className="text-text-muted">
                      {sale.buyer?.username ? `@${sale.buyer.username}` : 'Guest'} ·{' '}
                      {formatRelativeTime(sale.createdAt)}
                    </div>
                  </div>
                  <div className="font-mono text-accent-green">
                    {formatPrice(sale.sellerAmountCents)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Messages */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Recent Messages</h2>
            <Link href="/dashboard/messages" className="text-sm">
              View All →
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <p className="text-text-muted text-sm">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentMessages.map((message) => (
                <li key={message.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{message.sender.username}</span>
                    {!message.readAt && (
                      <span className="w-2 h-2 bg-accent-blue rounded-full" />
                    )}
                  </div>
                  <div className="text-text-muted truncate">
                    {message.content.slice(0, 60)}...
                  </div>
                  <div className="text-text-muted text-xs">
                    {formatRelativeTime(message.createdAt)}
                    {message.listing && ` · Re: ${message.listing.title}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
