import { stripe } from './stripe'

/**
 * Stripe Transfer Utilities for Escrow System
 *
 * Handles releasing funds to sellers after escrow period
 * and refunding buyers when disputes are resolved in their favor.
 */

interface TransferResult {
  success: boolean
  transferId?: string
  error?: string
}

/**
 * Release escrowed funds to seller
 *
 * Called when:
 * - Escrow period expires without dispute
 * - Admin resolves dispute in seller's favor
 */
export async function releaseToSeller(
  chargeId: string,
  sellerAccountId: string,
  amountCents: number,
  purchaseId: string
): Promise<TransferResult> {
  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: sellerAccountId,
      source_transaction: chargeId,
      metadata: {
        purchaseId,
        type: 'escrow_release',
      },
    })

    return {
      success: true,
      transferId: transfer.id,
    }
  } catch (error) {
    console.error('Failed to release funds to seller:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    }
  }
}

interface RefundResult {
  success: boolean
  refundId?: string
  error?: string
}

/**
 * Refund buyer when dispute is resolved in their favor (full refund)
 */
export async function refundBuyer(
  paymentIntentId: string,
  purchaseId: string,
  reason?: string
): Promise<RefundResult> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        purchaseId,
        type: 'dispute_refund',
        reason: reason || 'Dispute resolved in buyer favor',
      },
    })

    return {
      success: true,
      refundId: refund.id,
    }
  } catch (error) {
    console.error('Failed to refund buyer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    }
  }
}

/**
 * Partial refund to buyer (for partial dispute resolutions)
 * @param paymentIntentId - The Stripe payment intent ID
 * @param amountCents - The partial amount to refund in cents
 * @param purchaseId - The purchase ID for metadata
 * @param reason - Optional reason for the refund
 */
export async function refundBuyerPartial(
  paymentIntentId: string,
  amountCents: number,
  purchaseId: string,
  reason?: string
): Promise<RefundResult> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
      reason: 'requested_by_customer',
      metadata: {
        purchaseId,
        type: 'dispute_partial_refund',
        reason: reason || 'Dispute resolved with partial refund',
      },
    })

    return {
      success: true,
      refundId: refund.id,
    }
  } catch (error) {
    console.error('Failed to partially refund buyer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Partial refund failed',
    }
  }
}

/**
 * Get the charge ID from a payment intent
 * Needed because transfers require a charge ID, not payment intent ID
 */
export async function getChargeIdFromPaymentIntent(
  paymentIntentId: string
): Promise<string | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.latest_charge) {
      return typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge.id
    }

    return null
  } catch (error) {
    console.error('Failed to get charge ID:', error)
    return null
  }
}

/**
 * Release funds to seller by payment intent ID
 * Convenience function that gets charge ID first
 */
export async function releaseToSellerByPaymentIntent(
  paymentIntentId: string,
  sellerAccountId: string,
  amountCents: number,
  purchaseId: string
): Promise<TransferResult> {
  const chargeId = await getChargeIdFromPaymentIntent(paymentIntentId)

  if (!chargeId) {
    return {
      success: false,
      error: 'Could not find charge for payment intent',
    }
  }

  return releaseToSeller(chargeId, sellerAccountId, amountCents, purchaseId)
}

/**
 * Release funds to seller - throws on failure for use in transactions
 *
 * Use this variant when you need to ensure the transfer succeeds
 * or roll back the transaction.
 */
export async function releaseToSellerOrThrow(
  paymentIntentId: string,
  amountCents: number,
  stripeAccountId: string,
  purchaseId: string
): Promise<{ transferId: string }> {
  const result = await releaseToSellerByPaymentIntent(
    paymentIntentId,
    stripeAccountId,
    amountCents,
    purchaseId
  )
  if (!result.success) {
    throw new Error(result.error || 'Transfer failed')
  }
  return { transferId: result.transferId! }
}
