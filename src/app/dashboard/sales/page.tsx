import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Sales History',
}

export default async function DashboardSalesPage() {
  const session = await auth()

  const sales = await prisma.purchase.findMany({
    where: {
      sellerId: session!.user.id,
      status: { in: ['COMPLETED', 'REFUNDED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { title: true, slug: true } },
      buyer: { select: { username: true, email: true } },
    },
  })

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

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Sales History</h1>

      {sales.length === 0 ? (
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
                    <Badge variant={deliveryStatusVariant(sale.deliveryStatus)}>
                      {sale.deliveryStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {sales.length > 0 && (
        <div className="mt-6 p-4 bg-bg-accent border border-warning">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono">{sales.length}</div>
              <div className="text-sm text-text-muted">Total Sales</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-accent-green">
                {formatPrice(sales.reduce((sum, s) => sum + s.sellerAmountCents, 0))}
              </div>
              <div className="text-sm text-text-muted">Total Earnings</div>
            </div>
            <div>
              <div className="text-2xl font-mono">
                {sales.filter((s) => s.deliveryStatus === 'PENDING').length}
              </div>
              <div className="text-sm text-text-muted">Pending Delivery</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
