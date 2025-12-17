import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ListingGrid } from '@/components/listings/listing-grid'
import { CategoryNav } from '@/components/search/category-nav'
import { Button } from '@/components/ui/button'
import { APP_TAGLINE, JP_ACCENTS } from '@/lib/constants'

export default async function HomePage() {
  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Fetch latest listings
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      seller: {
        select: {
          username: true,
          isVerifiedSeller: true,
        },
      },
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  })

  // Fetch featured listings
  const featuredListings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      featured: true,
      featuredUntil: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      seller: {
        select: {
          username: true,
          isVerifiedSeller: true,
        },
      },
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  })

  return (
    <div className="container py-8">
      {/* Hero */}
      <section className="text-center mb-12 py-8 border-b border-border-crypt">
        <p className="text-text-dust text-sm jp-accent mb-2">{JP_ACCENTS.GRAVEYARD}</p>
        <h1 className="font-display text-4xl mb-4 text-accent-reanimate">
          THE GRAVEYARD
        </h1>
        <p className="text-text-bone max-w-2xl mx-auto mb-6">
          {APP_TAGLINE}. Buy and sell abandoned projects, SaaS apps, scripts, and boilerplates.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/listings">
            <Button size="lg">Browse Listings</Button>
          </Link>
          <Link href="/sell">
            <Button size="lg" variant="primary">Sell Your Project</Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <CategoryNav categories={categories} />

      {/* Featured listings (if any) */}
      {featuredListings.length > 0 && (
        <section className="my-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <span className="featured-marker">★ FEATURED</span>
          </h2>
          <ListingGrid listings={featuredListings} />
        </section>
      )}

      {/* Latest listings */}
      <section className="my-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl">LATEST LISTINGS</h2>
          <Link href="/listings" className="text-sm">
            View All →
          </Link>
        </div>
        <ListingGrid
          listings={listings}
          emptyMessage="No listings yet. Be the first to sell something!"
        />
      </section>

      {/* How it works */}
      <section className="my-12 py-8 border-t border-b border-border-crypt">
        <h2 className="font-display text-xl text-center mb-8 text-accent-reanimate">HOW IT WORKS</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="font-display text-lg mb-4">FOR SELLERS</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Create an account & connect Stripe</li>
              <li>List your project with details & screenshots</li>
              <li>Set your price (or make it free)</li>
              <li>Get paid when it sells</li>
            </ol>
            <p className="text-text-muted text-sm mt-4">
              We take 5-10%. You keep the rest.
            </p>
          </div>
          <div className="card">
            <h3 className="font-display text-lg mb-4">FOR BUYERS</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Browse projects by category or search</li>
              <li>Review screenshots, demos, and comments</li>
              <li>Buy with one click (card, Apple Pay, etc.)</li>
              <li>Download instantly or get access</li>
            </ol>
            <p className="text-text-muted text-sm mt-4">
              No subscriptions. Pay once, own forever.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <p className="text-lg mb-4 text-text-bone">Got a dead project collecting dust?</p>
        <Link href="/sell">
          <Button variant="primary" size="lg">
            Resurrect It — List for Free
          </Button>
        </Link>
      </section>
    </div>
  )
}
