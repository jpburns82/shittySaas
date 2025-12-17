import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatRelativeTime } from '@/lib/utils'
import { PriceBadge } from '@/components/listings/price-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'My Listings',
}

export default async function DashboardListingsPage() {
  const session = await auth()

  const listings = await prisma.listing.findMany({
    where: { sellerId: session!.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      _count: { select: { purchases: true } },
    },
  })

  const statusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green'
      case 'DRAFT':
        return 'yellow'
      case 'SOLD':
      case 'ARCHIVED':
        return 'default'
      default:
        return 'red'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">My Listings</h1>
        <Link href="/sell">
          <Button variant="primary">+ Create Listing</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-display text-xl mb-2">No listings yet</p>
          <p className="text-text-muted mb-6">
            Create your first listing to start selling.
          </p>
          <Link href="/sell">
            <Button variant="primary">Create Your First Listing</Button>
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Category</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Created</th>
                <th></th>
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
                    <PriceBadge
                      priceType={listing.priceType}
                      priceInCents={listing.priceInCents}
                      size="sm"
                    />
                  </td>
                  <td className="text-text-muted">{listing.category.name}</td>
                  <td>
                    <Badge variant={statusVariant(listing.status)}>
                      {listing.status}
                    </Badge>
                  </td>
                  <td className="font-mono">{listing._count.purchases}</td>
                  <td className="text-text-muted">
                    {formatRelativeTime(listing.createdAt)}
                  </td>
                  <td>
                    <Link href={`/sell/${listing.id}/edit`} className="text-sm">
                      Edit
                    </Link>
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
