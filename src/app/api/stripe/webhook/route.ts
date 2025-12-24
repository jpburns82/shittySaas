import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail, sendFeaturedConfirmationEmail } from '@/lib/email'
import { calculateEscrowExpiry } from '@/lib/escrow'
import { releaseToSellerByPaymentIntent } from '@/lib/stripe-transfers'
import { alertHighValueSale } from '@/lib/twilio'
import { SellerTier, BuyerTier } from '@prisma/client'
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
        // Unhandled event types are ignored
        break
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

  // Get purchase with seller tier info for escrow calculation
  const existingPurchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      listing: true,
      seller: { select: { sellerTier: true, id: true, email: true, username: true } },
      buyer: { select: { email: true, username: true } },
    },
  })

  if (!existingPurchase) return

  // Note: scanStatus will be available after Phase 3 (VirusTotal integration)
  // For now, undefined scanStatus is handled by escrow.ts as unscanned

  // Calculate escrow expiry based on risk factors
  const escrowExpiry = calculateEscrowExpiry({
    deliveryMethod: existingPurchase.listing.deliveryMethod,
    sellerTier: existingPurchase.seller.sellerTier,
    // scanStatus will be passed here after Phase 3
  })

  // Determine if this is instant release
  const isInstantRelease = escrowExpiry === null

  // Update purchase with status and escrow info
  const purchase = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'COMPLETED',
      stripePaymentIntentId: (session.payment_intent as string) || null,
      deliveryStatus: existingPurchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD' ? 'AUTO_COMPLETED' : 'PENDING',
      escrowStatus: isInstantRelease ? 'RELEASED' : 'HOLDING',
      escrowExpiresAt: escrowExpiry,
      escrowReleasedAt: isInstantRelease ? new Date() : null,
    },
    include: {
      listing: true,
      buyer: { select: { email: true, username: true } },
      seller: { select: { email: true, username: true, stripeAccountId: true, id: true } },
    },
  })

  // If instant release, transfer funds immediately
  if (isInstantRelease && purchase.seller.stripeAccountId && session.payment_intent) {
    await releaseToSellerByPaymentIntent(
      session.payment_intent as string,
      purchase.seller.stripeAccountId,
      purchase.sellerAmountCents,
      purchaseId
    )
  }

  // Post-purchase operations wrapped in try-catch to prevent cascading failures
  // Each operation is independent - failure in one shouldn't stop others

  // Update seller tier based on completed sales
  try {
    await updateSellerTier(purchase.seller.id)
  } catch (error) {
    console.error(`[webhook] Failed to update seller tier for ${purchase.seller.id}:`, error)
  }

  // Update buyer tier based on completed purchases (only for logged-in users)
  if (purchase.buyerId) {
    try {
      await updateBuyerTier(purchase.buyerId)
    } catch (error) {
      console.error(`[webhook] Failed to update buyer tier for ${purchase.buyerId}:`, error)
    }
  }

  // Send confirmation emails
  const buyerEmail = purchase.buyer?.email || purchase.guestEmail
  if (buyerEmail) {
    try {
      await sendPurchaseConfirmationEmail(
        buyerEmail,
        purchase.listing.title,
        purchase.amountPaidCents
      )
    } catch (error) {
      console.error(`[webhook] Failed to send purchase confirmation to ${buyerEmail}:`, error)
    }
  }

  if (purchase.seller.email) {
    try {
      await sendSaleNotificationEmail(
        purchase.seller.email,
        purchase.listing.title,
        purchase.sellerAmountCents,
        purchase.buyer?.username || 'Guest'
      )
    } catch (error) {
      console.error(`[webhook] Failed to send sale notification to ${purchase.seller.email}:`, error)
    }
  }

  // Alert admin for high-value sales (>$500)
  if (purchase.amountPaidCents >= 50000) {
    try {
      await alertHighValueSale(purchase.listing.title, purchase.amountPaidCents)
    } catch (error) {
      console.error(`[webhook] Failed to send high-value sale alert:`, error)
    }
  }
}

// Update seller tier based on completed sales count
async function updateSellerTier(sellerId: string) {
  const salesCount = await prisma.purchase.count({
    where: {
      sellerId,
      status: 'COMPLETED',
    },
  })

  let newTier: SellerTier = 'NEW'
  if (salesCount >= 10) newTier = 'PRO'
  else if (salesCount >= 3) newTier = 'TRUSTED'
  else if (salesCount >= 1) newTier = 'VERIFIED'

  await prisma.user.update({
    where: { id: sellerId },
    data: {
      sellerTier: newTier,
      totalSales: salesCount,
    },
  })
}

// Update buyer tier based on completed purchases count
async function updateBuyerTier(buyerId: string) {
  const purchaseCount = await prisma.purchase.count({
    where: {
      buyerId,
      status: 'COMPLETED',
    },
  })

  let newTier: BuyerTier = 'NEW'
  if (purchaseCount >= 3) newTier = 'TRUSTED'
  else if (purchaseCount >= 1) newTier = 'VERIFIED'

  await prisma.user.update({
    where: { id: buyerId },
    data: {
      buyerTier: newTier,
      totalPurchases: purchaseCount,
    },
  })
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
      stripePaymentIntentId: (session.payment_intent as string) || null,
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
