import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe'
import { calculatePlatformFee } from '@/lib/constants'

// POST /api/stripe/checkout - Create a checkout session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { listingId, guestEmail } = body

    if (!session && !guestEmail) {
      return NextResponse.json(
        { success: false, error: 'Must be logged in or provide email' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: { select: { stripeAccountId: true, stripeOnboarded: true } },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is not available' },
        { status: 400 }
      )
    }

    if (!listing.seller.stripeAccountId || !listing.seller.stripeOnboarded) {
      return NextResponse.json(
        { success: false, error: 'Seller has not set up payments' },
        { status: 400 }
      )
    }

    if (listing.priceType !== 'FIXED' || !listing.priceInCents || listing.priceInCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'This listing cannot be purchased directly' },
        { status: 400 }
      )
    }

    // Prevent buying own listing
    if (session?.user.id === listing.sellerId) {
      return NextResponse.json(
        { success: false, error: 'Cannot purchase your own listing' },
        { status: 400 }
      )
    }

    // Calculate platform fee
    const platformFeeCents = calculatePlatformFee(listing.priceInCents)

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: session?.user.id || null,
        guestEmail: guestEmail || null,
        amountPaidCents: listing.priceInCents,
        platformFeeCents,
        sellerAmountCents: listing.priceInCents - platformFeeCents,
        status: 'PENDING',
        deliveryStatus: 'PENDING',
      },
    })

    // Create Stripe checkout session
    const { origin } = new URL(request.url)
    const checkoutSession = await createCheckoutSession({
      listingId: listing.id,
      listingTitle: listing.title,
      priceInCents: listing.priceInCents,
      sellerStripeAccountId: listing.seller.stripeAccountId!,
      buyerId: session?.user.id,
      buyerEmail: session?.user.email || guestEmail,
      successUrl: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}&purchaseId=${purchase.id}`,
      cancelUrl: `${origin}/listing/${listing.slug}`,
    })

    // Update purchase with Stripe session ID
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { stripePaymentIntentId: checkoutSession.id },
    })

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
    })
  } catch (error) {
    console.error('POST /api/stripe/checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
