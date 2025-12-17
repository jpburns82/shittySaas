import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { CheckoutButton } from '@/components/payments/checkout-button'
import { PriceBadge } from '@/components/listings/price-badge'
import { Button } from '@/components/ui/button'

interface PurchasePageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Purchase',
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { id } = await params
  const session = await auth()

  // Find listing
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: 'ACTIVE',
    },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          stripeAccountId: true,
          stripeOnboarded: true,
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Can't buy your own listing
  if (session?.user?.id === listing.sellerId) {
    redirect(`/listing/${listing.slug}`)
  }

  // Check if seller can receive payments
  if (!listing.seller.stripeAccountId || !listing.seller.stripeOnboarded) {
    return (
      <div className="container py-12">
        <div className="max-w-lg mx-auto card text-center">
          <h1 className="font-display text-2xl mb-4 text-accent-red">
            Seller Cannot Receive Payments
          </h1>
          <p className="text-text-secondary mb-4">
            The seller hasn&apos;t completed their payment setup yet.
            Please contact them or check back later.
          </p>
          <Link href={`/listing/${listing.slug}`}>
            <Button>Back to Listing</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Contact-only listings can't be purchased directly
  if (listing.priceType === 'CONTACT') {
    redirect(`/listing/${listing.slug}`)
  }

  return (
    <div className="container py-12">
      <div className="max-w-lg mx-auto">
        {/* Breadcrumb */}
        <nav className="breadcrumbs mb-6">
          <Link href={`/listing/${listing.slug}`}>← Back to listing</Link>
        </nav>

        <div className="card">
          <h1 className="font-display text-2xl mb-6">Complete Purchase</h1>

          {/* Listing summary */}
          <div className="border border-border-dark p-4 mb-6 bg-bg-primary">
            <h2 className="font-medium mb-2">{listing.title}</h2>
            <p className="text-sm text-text-muted mb-2">{listing.shortDescription}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">by @{listing.seller.username}</span>
              <PriceBadge
                priceType={listing.priceType}
                priceInCents={listing.priceInCents}
                size="lg"
              />
            </div>
          </div>

          {/* What you'll get */}
          <div className="mb-6">
            <h3 className="font-display text-base mb-3">What&apos;s Included</h3>
            <ul className="text-sm space-y-1">
              {listing.includesSourceCode && <li>✓ Full source code</li>}
              {listing.includesDatabase && <li>✓ Database schema</li>}
              {listing.includesDocs && <li>✓ Documentation</li>}
              {listing.includesDeployGuide && <li>✓ Deployment guide</li>}
              {listing.includesSupport && (
                <li>✓ {listing.supportDays || 30} days email support</li>
              )}
              {listing.includesUpdates && <li>✓ Future updates</li>}
              {listing.includesCommercialLicense && <li>✓ Commercial license</li>}
            </ul>
          </div>

          {/* Delivery method */}
          <div className="mb-6 p-3 bg-bg-accent border border-warning">
            <h3 className="font-display text-sm mb-1">Delivery</h3>
            <p className="text-sm text-text-secondary">
              {listing.deliveryMethod === 'INSTANT_DOWNLOAD'
                ? 'Instant download after payment'
                : listing.deliveryMethod === 'REPOSITORY_ACCESS'
                  ? `Repository access within ${listing.deliveryTimeframeDays || 1} day(s)`
                  : listing.deliveryMethod === 'MANUAL_TRANSFER'
                    ? `Manual transfer within ${listing.deliveryTimeframeDays || 1} day(s)`
                    : `Domain/asset transfer within ${listing.deliveryTimeframeDays || 7} day(s)`}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mb-6 p-3 bg-bg-grave border border-border-crypt text-xs text-text-dust">
            <strong>Notice:</strong> All sales are final. UndeadList is a marketplace
            and does not guarantee code quality. Review the listing carefully before purchasing.
            Refunds are at the seller&apos;s discretion.
          </div>

          {/* Checkout button */}
          <CheckoutButton
            listingId={listing.id}
            listingTitle={listing.title}
            priceInCents={listing.priceInCents || 0}
            priceType={listing.priceType}
          />

          {/* Guest checkout note */}
          {!session?.user && (
            <p className="text-xs text-text-muted mt-4 text-center">
              You can checkout as a guest. Download link will be sent to your email.
              <br />
              <Link href="/login" className="text-link">
                Login
              </Link>{' '}
              to track your purchases.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
