import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { ListingsTable } from '@/components/dashboard/listings-table'

export const metadata = {
  title: 'My Listings',
}

export default async function DashboardListingsPage() {
  const session = await auth()

  const listings = await prisma.listing.findMany({
    where: { sellerId: session!.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      priceType: true,
      priceInCents: true,
      status: true,
      featured: true,
      featuredUntil: true,
      createdAt: true,
      category: { select: { name: true } },
      _count: { select: { purchases: true } },
    },
  })

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
        <ListingsTable listings={listings} />
      )}
    </div>
  )
}
