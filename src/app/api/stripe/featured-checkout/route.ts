import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { FEATURED_DURATION_OPTIONS, FeaturedDurationKey } from '@/lib/constants'
import { validateCSRF } from '@/lib/csrf'
import { createLogger } from '@/lib/logger'

const log = createLogger('featured-checkout')

// POST /api/stripe/featured-checkout - Create a checkout session for featured listing promotion
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfValid = await validateCSRF(request)
    if (!csrfValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid request. Please refresh and try again.' },
        { status: 403 }
      )
    }

    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Must be logged in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { listingId, duration } = body as { listingId: string; duration: FeaturedDurationKey }

    if (!listingId || !duration) {
      return NextResponse.json(
        { success: false, error: 'Listing ID and duration are required' },
        { status: 400 }
      )
    }

    const durationOption = FEATURED_DURATION_OPTIONS[duration]
    if (!durationOption) {
      return NextResponse.json(
        { success: false, error: 'Invalid duration option' },
        { status: 400 }
      )
    }

    // Verify listing exists and belongs to the user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        sellerId: true,
        featured: true,
        featuredUntil: true,
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only promote your own listings' },
        { status: 403 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Only active listings can be promoted' },
        { status: 400 }
      )
    }

    // Calculate start and end dates
    // If already featured, extend from current end date; otherwise start now
    const now = new Date()
    let startDate = now
    if (listing.featured && listing.featuredUntil && new Date(listing.featuredUntil) > now) {
      startDate = new Date(listing.featuredUntil)
    }
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationOption.days)

    // Check for existing pending purchase for this listing
    const existingPurchase = await prisma.featuredPurchase.findFirst({
      where: {
        listingId,
        status: 'PENDING',
      },
    })

    if (existingPurchase) {
      // Delete the stale pending purchase
      await prisma.featuredPurchase.delete({
        where: { id: existingPurchase.id },
      })
    }

    // Create featured purchase record
    const featuredPurchase = await prisma.featuredPurchase.create({
      data: {
        listingId,
        startDate,
        endDate,
        daysCount: durationOption.days,
        amountPaidCents: durationOption.priceInCents,
        status: 'PENDING',
      },
    })

    // Create Stripe checkout session (platform payment, not connected account)
    const { origin } = new URL(request.url)
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Feature "${listing.title}" for ${durationOption.label}`,
              description: 'Featured listing promotion on UndeadList',
            },
            unit_amount: durationOption.priceInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email || undefined,
      success_url: `${origin}/dashboard/listings?featured=success`,
      cancel_url: `${origin}/dashboard/listings?featured=cancelled`,
      metadata: {
        type: 'featured_purchase',
        featuredPurchaseId: featuredPurchase.id,
        listingId,
        duration,
      },
    })

    // Update featured purchase with Stripe session ID
    await prisma.featuredPurchase.update({
      where: { id: featuredPurchase.id },
      data: { stripePaymentIntentId: checkoutSession.id },
    })

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
    })
  } catch (error) {
    log.error('Failed to create checkout session', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
