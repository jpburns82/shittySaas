import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PAGINATION } from '@/lib/constants'
import { PurchaseStatus } from '@prisma/client'

export const metadata = {
  title: 'Sales History',
}

export default async function DashboardSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  const statusFilter: PurchaseStatus[] = ['COMPLETED', 'REFUNDED']

  const [sales, total, totalEarnings, pendingCount] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        sellerId: session!.user.id,
        status: { in: statusFilter },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        listing: { select: { title: true, slug: true } },
        buyer: { select: { username: true, email: true } },
      },
    }),
    prisma.purchase.count({
      where: {
        sellerId: session!.user.id,
        status: { in: statusFilter },
      },
    }),
    prisma.purchase.aggregate({
      where: {
        sellerId: session!.user.id,
        status: { in: statusFilter },
      },
      _sum: { sellerAmountCents: true },
    }),
    prisma.purchase.count({
      where: {
        sellerId: session!.user.id,
        status: { in: statusFilter },
        deliveryStatus: 'PENDING',
      },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const deliveryStatusVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'AUTO_COMPLETED':
        return 'green'
      case 'DELIVERED':
        return 'blue'
      case 'PENDING':
        return 'yellow'
      default:
        return 'default'
    }
  }

  const escrowStatusVariant = (status: string | null) => {
    switch (status) {
      case 'RELEASED':
        return 'green'
      case 'HOLDING':
        return 'yellow'
      case 'DISPUTED':
        return 'red'
      case 'REFUNDED':
        return 'blue'
      default:
        return 'default'
    }
  }

  const escrowStatusLabel = (status: string | null) => {
    switch (status) {
      case 'RELEASED':
        return '✓ Paid Out'
      case 'HOLDING':
        return 'In Escrow'
      case 'DISPUTED':
        return '⚠ Disputed'
      case 'REFUNDED':
        return 'Refunded'
      default:
        return 'Pending'
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Sales History</h1>

      {sales.length === 0 && page === 1 ? (
        <div className="card text-center py-12">
          <p className="font-display text-xl mb-2">No sales yet</p>
          <p className="text-text-muted">
            When someone buys your listing, it will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Listing</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Your Earnings</th>
                <th>Payout</th>
                <th>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="text-text-muted">{formatDate(sale.createdAt)}</td>
                  <td>
                    <Link href={`/listing/${sale.listing.slug}`} className="font-medium">
                      {sale.listing.title}
                    </Link>
                  </td>
                  <td>
                    {sale.buyer ? (
                      <Link href={`/user/${sale.buyer.username}`}>
                        @{sale.buyer.username}
                      </Link>
                    ) : (
                      <span className="text-text-muted">{sale.guestEmail}</span>
                    )}
                  </td>
                  <td className="font-mono">{formatPrice(sale.amountPaidCents)}</td>
                  <td className="font-mono text-accent-green">
                    {formatPrice(sale.sellerAmountCents)}
                  </td>
                  <td>
                    <Badge variant={escrowStatusVariant(sale.escrowStatus)}>
                      {escrowStatusLabel(sale.escrowStatus)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={deliveryStatusVariant(sale.deliveryStatus)}>
                      {sale.deliveryStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 py-4 border-t border-border">
              {page > 1 && (
                <Link
                  href={`/dashboard/sales?page=${page - 1}`}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-bg-accent"
                >
                  ← Prev
                </Link>
              )}
              <span className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/sales?page=${page + 1}`}
                  className="px-3 py-1 text-sm border border-border rounded hover:bg-bg-accent"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary - uses aggregate stats for all sales */}
      {total > 0 && (
        <div className="mt-6 p-4 bg-bg-accent border border-warning">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono">{total}</div>
              <div className="text-sm text-text-muted">Total Sales</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-accent-green">
                {formatPrice(totalEarnings._sum?.sellerAmountCents || 0)}
              </div>
              <div className="text-sm text-text-muted">Total Earnings</div>
            </div>
            <div>
              <div className="text-2xl font-mono">{pendingCount}</div>
              <div className="text-sm text-text-muted">Pending Delivery</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
