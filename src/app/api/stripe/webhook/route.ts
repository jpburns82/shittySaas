import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/lib/stripe'
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail, sendFeaturedConfirmationEmail, sendGuestDownloadEmail } from '@/lib/email'
import { calculateEscrowExpiry } from '@/lib/escrow'
import { releaseToSellerByPaymentIntent } from '@/lib/stripe-transfers'
import { alertHighValueSale } from '@/lib/twilio'
import { getSellerTier } from '@/lib/seller-limits'
import { getBuyerTier } from '@/lib/buyer-limits'
import { createLogger } from '@/lib/logger'
import Stripe from 'stripe'

const log = createLogger('stripe-webhook')

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
    log.error('Webhook processing error', {
      error: error instanceof Error ? error.message : String(error),
    })
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

  // Wrap purchase update + tier updates in a single transaction for atomicity
  // This prevents race conditions where concurrent purchases could cause incorrect tier counts
  const purchase = await prisma.$transaction(async (tx) => {
    // 1. Update purchase with status and escrow info
    const updatedPurchase = await tx.purchase.update({
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

    // 2. Update seller tier atomically using increment to prevent race conditions
    // Increment is atomic even with concurrent transactions, preventing count drift
    const updatedSeller = await tx.user.update({
      where: { id: updatedPurchase.seller.id },
      data: {
        totalSales: { increment: 1 },
      },
    })
    const newSellerTier = getSellerTier(updatedSeller.totalSales)
    if (updatedSeller.sellerTier !== newSellerTier) {
      await tx.user.update({
        where: { id: updatedPurchase.seller.id },
        data: { sellerTier: newSellerTier },
      })
    }

    // 3. Update buyer tier atomically using increment (if not guest)
    if (updatedPurchase.buyerId) {
      const updatedBuyer = await tx.user.update({
        where: { id: updatedPurchase.buyerId },
        data: {
          totalPurchases: { increment: 1 },
        },
      })
      const newBuyerTier = getBuyerTier(updatedBuyer.totalPurchases)
      if (updatedBuyer.buyerTier !== newBuyerTier) {
        await tx.user.update({
          where: { id: updatedPurchase.buyerId },
          data: { buyerTier: newBuyerTier },
        })
      }
    }

    return updatedPurchase
  })

  // If instant release, transfer funds immediately (OUTSIDE transaction - external API call)
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
      log.error('Failed to send purchase confirmation email', {
        buyerEmail,
        purchaseId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Send guest download email for instant downloads
  if (purchase.guestEmail && purchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD') {
    try {
      await sendGuestDownloadEmail(
        purchase.guestEmail,
        purchase.listing.title,
        purchase.id
      )
    } catch (error) {
      log.error('Failed to send guest download email', {
        guestEmail: purchase.guestEmail,
        purchaseId,
        error: error instanceof Error ? error.message : String(error),
      })
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
      log.error('Failed to send sale notification email', {
        sellerEmail: purchase.seller.email,
        purchaseId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Alert admin for high-value sales (>$500)
  if (purchase.amountPaidCents >= 50000) {
    try {
      await alertHighValueSale(purchase.listing.title, purchase.amountPaidCents)
    } catch (error) {
      log.error('Failed to send high-value sale alert', {
        purchaseId,
        amountCents: purchase.amountPaidCents,
        error: error instanceof Error ? error.message : String(error),
      })
    }
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

  // Wrap all database operations in a single transaction for atomicity
  // This ensures featuredPurchase update and listing update succeed or fail together
  const { featuredPurchase, seller } = await prisma.$transaction(async (tx) => {
    // 1. Update featured purchase status
    const updatedFeaturedPurchase = await tx.featuredPurchase.update({
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

    // 2. Update the listing to be featured (atomically with above)
    await tx.listing.update({
      where: { id: updatedFeaturedPurchase.listingId },
      data: {
        featured: true,
        featuredUntil: updatedFeaturedPurchase.endDate,
      },
    })

    // 3. Get seller email for confirmation (inside transaction for consistency)
    const sellerData = await tx.user.findUnique({
      where: { id: updatedFeaturedPurchase.listing.sellerId },
      select: { email: true },
    })

    return { featuredPurchase: updatedFeaturedPurchase, seller: sellerData }
  })

  // Send confirmation email (outside transaction - external service call)
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
