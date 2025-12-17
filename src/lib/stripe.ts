import Stripe from 'stripe'
import { calculatePlatformFee } from './constants'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// ----- STRIPE CONNECT -----

// Create a Stripe Connect account for a seller
export async function createConnectAccount(userId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      userId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  return account
}

// Create onboarding link for seller
export async function createAccountLink(accountId: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: `${returnUrl}?success=true`,
    type: 'account_onboarding',
  })

  return accountLink.url
}

// Check if account is fully onboarded
export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    isOnboarded: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
    chargesEnabled: account.charges_enabled,
  }
}

// Create login link for seller's Stripe dashboard
export async function createDashboardLink(accountId: string) {
  const link = await stripe.accounts.createLoginLink(accountId)
  return link.url
}

// ----- CHECKOUT -----

interface CreateCheckoutParams {
  listingId: string
  listingTitle: string
  priceInCents: number
  sellerStripeAccountId: string
  buyerId?: string
  buyerEmail?: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession({
  listingId,
  listingTitle,
  priceInCents,
  sellerStripeAccountId,
  buyerId,
  buyerEmail,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams) {
  const platformFee = calculatePlatformFee(priceInCents)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listingTitle,
            description: `Purchase from SideProject.deals`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      metadata: {
        listingId,
        buyerId: buyerId || '',
      },
    },
    customer_email: buyerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      listingId,
      buyerId: buyerId || '',
    },
  })

  return session
}

// ----- PAYOUTS -----

export async function getAccountBalance(accountId: string) {
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  })

  return {
    available: balance.available.reduce((sum, b) => sum + b.amount, 0),
    pending: balance.pending.reduce((sum, b) => sum + b.amount, 0),
  }
}

export async function getPayouts(accountId: string, limit = 10) {
  const payouts = await stripe.payouts.list(
    { limit },
    { stripeAccount: accountId }
  )

  return payouts.data
}

// ----- REFUNDS -----

export async function createRefund(paymentIntentId: string, reason?: string) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
    metadata: {
      reason: reason || 'Seller initiated refund',
    },
  })

  return refund
}

// ----- WEBHOOK HELPERS -----

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(body, signature, secret)
}
