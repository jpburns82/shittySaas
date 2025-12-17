import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export const metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminDashboardPage() {
  // Get platform stats
  const [
    totalUsers,
    totalListings,
    pendingListings,
    totalSales,
    totalRevenue,
    recentReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'DRAFT' } }),
    prisma.purchase.count({ where: { status: 'COMPLETED' } }),
    prisma.purchase.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { platformFeeCents: true },
    }),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers },
    { label: 'Total Listings', value: totalListings },
    { label: 'Draft Listings', value: pendingListings, highlight: pendingListings > 0 },
    { label: 'Total Sales', value: totalSales },
    { label: 'Platform Revenue', value: formatPrice(totalRevenue._sum.platformFeeCents || 0), isMoney: true },
    { label: 'Open Reports', value: recentReports, highlight: recentReports > 0 },
  ]

  // Get recent activity
  const recentListings = await prisma.listing.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      seller: { select: { username: true } },
    },
  })

  const recentSales = await prisma.purchase.findMany({
    take: 5,
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amountPaidCents: true,
      platformFeeCents: true,
      createdAt: true,
      listing: { select: { title: true } },
    },
  })

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`card text-center ${stat.highlight ? 'border-accent-yellow' : ''}`}
          >
            <div className={`text-3xl font-mono ${stat.isMoney ? 'text-accent-green' : ''}`}>
              {stat.value}
            </div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Recent Listings</h2>
            <Link href="/admin/listings" className="text-sm text-link">
              View all →
            </Link>
          </div>

          <div className="space-y-2">
            {recentListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
              >
                <div>
                  <div className="font-medium">{listing.title}</div>
                  <div className="text-sm text-text-muted">
                    by @{listing.seller.username}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 ${
                    listing.status === 'DRAFT'
                      ? 'bg-accent-yellow text-black'
                      : listing.status === 'ACTIVE'
                      ? 'bg-accent-green text-black'
                      : 'bg-bg-accent'
                  }`}
                >
                  {listing.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card">
          <h2 className="font-display text-lg mb-4">Recent Sales</h2>

          <div className="space-y-2">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
              >
                <div>
                  <div className="font-medium">{sale.listing.title}</div>
                  <div className="text-sm text-text-muted">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{formatPrice(sale.amountPaidCents)}</div>
                  <div className="text-xs text-accent-green">
                    +{formatPrice(sale.platformFeeCents)} fee
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 card">
        <h2 className="font-display text-lg mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/admin/listings?status=DRAFT" className="btn btn-primary">
            Review Drafts ({pendingListings})
          </Link>
          <Link href="/admin/reports" className="btn">
            View Reports ({recentReports})
          </Link>
          <Link href="/admin/users" className="btn">
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  )
}
