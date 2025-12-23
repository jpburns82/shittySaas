import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ListingGrid } from '@/components/listings/listing-grid'
import { Button } from '@/components/ui/button'
import { APP_TAGLINE } from '@/lib/constants'

// Skeleton components for loading states
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
async function FeaturedListingsSection() {
  const featuredListings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      featured: true,
      OR: [
        { featuredUntil: null }, // indefinite
        { featuredUntil: { gte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      seller: {
        select: {
          username: true,
          isVerifiedSeller: true,
          sellerTier: true,
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


export default function HomePage() {
  return (
    <div className="container pt-4 pb-8">
      {/* Hero Section */}
      <section className="mb-8 py-12 border-b border-border-crypt">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Content - centered on all screens */}
          <div className="text-center">
            <p className="font-dela-gothic text-xl md:text-2xl text-text-dust mb-4 tracking-wider">
              作られた。でも、まだ見つかっていない。
            </p>
            <h1 className="font-bungee text-5xl md:text-6xl lg:text-7xl tracking-wider mb-8 text-gradient-cyan">
              UNDEAD LIST
            </h1>
          </div>
          {/* Logo - 40% larger with neon effect */}
          <div className="flex-shrink-0 max-w-[560px]">
            <Image
              src="/images/logo-cropped.png"
              alt="UndeadList"
              width={560}
              height={280}
              priority
              className="w-full h-auto"
            />
          </div>
          {/* Body text and buttons */}
          <div className="text-center">
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

      {/* Featured listings - with Suspense */}
      <Suspense fallback={<ListingGridSkeleton count={4} />}>
        <FeaturedListingsSection />
      </Suspense>

      {/* How it works - static content, no Suspense needed */}
      <section className="my-6 py-5 border-t border-b border-border-crypt">
        <h2 className="font-display text-xl text-center mb-4 text-accent-electric">HOW IT WORKS</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card rounded-xl border border-border-light">
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
          <div className="card rounded-xl border border-border-light">
            <h3 className="font-display text-lg mb-4">FOR BUYERS</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>Browse projects by category or search</li>
              <li>Review screenshots, demos, and comments</li>
              <li>Buy with one click (card, Apple Pay, etc.)</li>
              <li>Download instantly or get access</li>
            </ol>
            <p className="text-text-muted text-sm mt-4">
              No subscriptions. No auctions. Pay once, own forever.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - static content */}
      <section className="text-center py-5">
        <p className="text-lg mb-4 text-text-bone">Built. Shipped. Still waiting?</p>
        <div className="flex flex-col items-center">
          <span className="text-text-dust text-sm jp-accent mb-2">リスティング</span>
          <Link href="/sell">
            <Button variant="primary" size="lg">
              List for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
