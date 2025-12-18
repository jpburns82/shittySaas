import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ListingGrid } from '@/components/listings/listing-grid'
import { CategoryNav } from '@/components/search/category-nav'
import { Button } from '@/components/ui/button'
import { APP_TAGLINE, JP_ACCENTS } from '@/lib/constants'

// Skeleton components for loading states
function CategorySkeleton() {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto py-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 w-24 bg-bg-grave rounded animate-pulse" />
      ))}
    </div>
  )
}

function ListingGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-bg-grave rounded-lg p-4 animate-pulse">
          <div className="h-40 bg-bg-tombstone rounded mb-3" />
          <div className="h-4 bg-bg-tombstone rounded w-3/4 mb-2" />
          <div className="h-3 bg-bg-tombstone rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

// Async components for data fetching with Suspense
async function CategoriesSection() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return <CategoryNav categories={categories} />
}

async function FeaturedListingsSection() {
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

  if (featuredListings.length === 0) {
    return null
  }

  return (
    <section className="my-8">
      <h2 className="font-display text-xl mb-4 flex items-center gap-2">
        <span className="featured-marker">★ FEATURED</span>
      </h2>
      <ListingGrid listings={featuredListings} />
    </section>
  )
}

async function LatestListingsSection() {
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

  return (
    <section className="mt-4 mb-6">
      <div className="flex justify-between items-center mb-3">
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
  )
}

export default function HomePage() {
  return (
    <div className="container pt-4 pb-8">
      {/* Hero Section */}
      <section className="mb-8 py-12 border-b border-border-crypt">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Logo - natural sizing with max-width */}
          <div className="flex-shrink-0 max-w-[400px]">
            <Image
              src="/images/logo-cropped.png"
              alt="UndeadList"
              width={400}
              height={200}
              priority
              className="w-full h-auto"
            />
          </div>
          {/* Content - centered on all screens */}
          <div className="text-center">
            <p className="text-text-dust text-sm jp-accent mb-2">{JP_ACCENTS.TAGLINE}</p>
            <h1 className="font-display text-4xl lg:text-5xl mb-3 text-accent-electric">
              UNDEAD LIST
            </h1>
            <p className="text-text-muted text-lg mb-6 max-w-xl">
              {APP_TAGLINE}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/sell">
                <Button size="lg" variant="primary">Sell Your Project</Button>
              </Link>
              <Link href="/listings">
                <Button size="lg" variant="secondary">Browse Listings</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - with Suspense */}
      <Suspense fallback={<CategorySkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* Featured listings - with Suspense */}
      <Suspense fallback={<ListingGridSkeleton count={4} />}>
        <FeaturedListingsSection />
      </Suspense>

      {/* Latest listings - with Suspense */}
      <Suspense fallback={<ListingGridSkeleton count={12} />}>
        <LatestListingsSection />
      </Suspense>

      {/* How it works - static content, no Suspense needed */}
      <section className="my-6 py-5 border-t border-b border-border-crypt">
        <h2 className="font-display text-xl text-center mb-4 text-accent-electric">HOW IT WORKS</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-display text-lg mb-4">FOR SELLERS</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Create an account & connect Stripe</li>
              <li>List your project with details & screenshots</li>
              <li>Set your price (or make it free)</li>
              <li>Get paid when it sells</li>
            </ol>
            <p className="text-text-muted text-sm mt-4">
              We handle payments, delivery, and support.
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

      {/* CTA - static content */}
      <section className="text-center py-5">
        <p className="text-lg mb-4 text-text-bone">Built. Shipped. Still waiting?</p>
        <Link href="/sell">
          <Button variant="primary" size="lg">
            Resurrect It — List for Free
          </Button>
        </Link>
      </section>
    </div>
  )
}
