import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail, sendFeaturedConfirmationEmail } from '@/lib/email'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const event = constructWebhookEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Check if this is a featured purchase or regular purchase
        if (session.metadata?.type === 'featured_purchase') {
          await handleFeaturedPurchaseCompleted(session)
        } else {
          await handleCheckoutCompleted(session)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const purchaseId = session.metadata?.purchaseId
  if (!purchaseId) return

  const purchase = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'COMPLETED',
      stripePaymentIntentId: session.payment_intent as string,
      deliveryStatus: 'PENDING',
    },
    include: {
      listing: true,
      buyer: { select: { email: true, username: true } },
      seller: { select: { email: true, username: true } },
    },
  })

  // Handle instant download listings
  if (purchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD') {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { deliveryStatus: 'AUTO_COMPLETED' },
    })
  }

  // Send confirmation emails
  const buyerEmail = purchase.buyer?.email || purchase.guestEmail
  if (buyerEmail) {
    await sendPurchaseConfirmationEmail(
      buyerEmail,
      purchase.listing.title,
      purchase.amountPaidCents
    )
  }

  if (purchase.seller.email) {
    await sendSaleNotificationEmail(
      purchase.seller.email,
      purchase.listing.title,
      purchase.sellerAmountCents,
      purchase.buyer?.username || 'Guest'
    )
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Update user's Stripe status
  await prisma.user.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripeOnboarded: account.details_submitted,
      stripePayoutsEnabled: account.payouts_enabled || false,
    },
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const purchaseId = paymentIntent.metadata?.purchaseId
  if (!purchaseId) return

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: 'FAILED' },
  })
}

async function handleFeaturedPurchaseCompleted(session: Stripe.Checkout.Session) {
  const featuredPurchaseId = session.metadata?.featuredPurchaseId
  if (!featuredPurchaseId) return

  // Update featured purchase status
  const featuredPurchase = await prisma.featuredPurchase.update({
    where: { id: featuredPurchaseId },
    data: {
      stripePaymentIntentId: session.payment_intent as string,
      status: 'ACTIVE',
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          sellerId: true,
        },
      },
    },
  })

  // Update the listing to be featured
  await prisma.listing.update({
    where: { id: featuredPurchase.listingId },
    data: {
      featured: true,
      featuredUntil: featuredPurchase.endDate,
    },
  })

  // Get seller email for confirmation
  const seller = await prisma.user.findUnique({
    where: { id: featuredPurchase.listing.sellerId },
    select: { email: true },
  })

  // Send confirmation email
  if (seller?.email) {
    const durationDays = Math.ceil(
      (featuredPurchase.endDate.getTime() - featuredPurchase.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const listingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/listing/${featuredPurchase.listing.slug}`

    await sendFeaturedConfirmationEmail(
      seller.email,
      featuredPurchase.listing.title,
      durationDays,
      listingUrl
    )
  }
}
