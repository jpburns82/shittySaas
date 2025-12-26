import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe'
import { calculatePlatformFee } from '@/lib/fees'
import { canPurchase, canGuestPurchase } from '@/lib/buyer-limits'
import { validateCSRF } from '@/lib/csrf'

// POST /api/stripe/checkout - Create a checkout session
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

    // Check buyer spend limits
    if (session?.user.id) {
      // Logged-in user limits
      const spendCheck = await canPurchase(session.user.id, listing.priceInCents)
      if (!spendCheck.allowed) {
        return NextResponse.json(
          { success: false, error: spendCheck.reason },
          { status: 400 }
        )
      }
    } else if (guestEmail) {
      // Guest checkout limits ($50/day)
      const guestCheck = await canGuestPurchase(guestEmail, listing.priceInCents)
      if (!guestCheck.allowed) {
        return NextResponse.json(
          { success: false, error: guestCheck.reason },
          { status: 400 }
        )
      }
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
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://undeadlist.com'
    const checkoutSession = await createCheckoutSession({
      listingId: listing.id,
      listingTitle: listing.title,
      priceInCents: listing.priceInCents,
      sellerStripeAccountId: listing.seller.stripeAccountId!,
      sellerId: listing.sellerId,
      deliveryMethod: listing.deliveryMethod,
      buyerId: session?.user.id,
      buyerEmail: session?.user.email || guestEmail,
      successUrl: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}&purchaseId=${purchase.id}`,
      cancelUrl: `${origin}/listing/${listing.slug}`,
    })

    // Note: stripePaymentIntentId is set by the webhook when payment completes

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
