import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ListingForm } from '@/components/listings/listing-form'
import { StripeConnectButton } from '@/components/payments/stripe-connect-button'
import { createListingSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

export const metadata = {
  title: 'Sell Your Project',
  description: 'List your side project, SaaS app, or software for sale on UndeadList. Give your code a second life.',
}

export default async function SellPage() {
  const session = await auth()

  // Require login
  if (!session?.user) {
    redirect('/login?callbackUrl=/sell')
  }

  // Check if user has Stripe connected
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeAccountId: true,
      stripeOnboarded: true,
    },
  })

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // If Stripe not connected, show onboarding prompt
  if (!user?.stripeAccountId || !user?.stripeOnboarded) {
    return (
      <div className="container py-12">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-2xl mb-6">Sell Your Project</h1>

          <div className="card">
            <h2 className="font-display text-lg mb-4">Connect Stripe to Get Paid</h2>
            <p className="text-text-secondary mb-6">
              Before you can list a project for sale, you need to connect your Stripe account.
              This allows us to send your earnings directly to your bank account.
            </p>

            <StripeConnectButton isConnected={false} />

            <div className="mt-6 pt-6 border-t border-border-light text-sm text-text-muted">
              <h3 className="font-medium text-text-primary mb-2">Why Stripe?</h3>
              <ul className="space-y-1">
                <li>• Secure payment processing</li>
                <li>• Direct payouts to your bank</li>
                <li>• We never see your banking info</li>
                <li>• Support for 135+ currencies</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show listing form
  async function handleSubmit(data: unknown): Promise<{
    success: false
    errors: Record<string, string[]>
    message: string
  } | void> {
    'use server'

    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        errors: {},
        message: 'You must be logged in to create a listing',
      }
    }

    const validation = createListingSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
        message: validation.error.errors[0].message,
      }
    }

    const validData = validation.data

    // Generate unique slug
    let slug = slugify(validData.title)
    const existing = await prisma.listing.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const listing = await prisma.listing.create({
      data: {
        ...validData,
        slug,
        sellerId: session.user.id,
        status: 'DRAFT',
      },
    })

    redirect(`/listing/${listing.slug}`)
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl mb-2">Create a Listing</h1>
          <p className="text-text-muted">
            Fill out the form below to list your project for sale.
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <ListingForm
            categories={categories}
            onSubmit={handleSubmit}
            submitLabel="Create Listing"
          />
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-bg-accent border border-warning">
          <h3 className="font-display text-base mb-2">Tips for a Great Listing</h3>
          <ul className="text-sm space-y-1 text-text-secondary">
            <li>• Add screenshots showing your project in action</li>
            <li>• Include a live demo link if possible</li>
            <li>• Be specific about what&apos;s included</li>
            <li>• Describe the tech stack accurately</li>
            <li>• Set a fair price based on value provided</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
