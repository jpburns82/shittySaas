import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseToSellerByPaymentIntent, refundBuyer, refundBuyerPartial } from '@/lib/stripe-transfers'
import { calculatePlatformFee } from '@/lib/fees'
import { alertDisputeResolved } from '@/lib/twilio'
import { createLogger } from '@/lib/logger'

const log = createLogger('dispute-resolve')

type Resolution = 'REFUND_BUYER' | 'RELEASE_TO_SELLER' | 'PARTIAL_REFUND'

// POST /api/admin/disputes/[purchaseId]/resolve - Admin resolves a dispute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { purchaseId } = await params
    const body = await request.json()
    const { resolution, notes, partialAmountCents } = body as {
      resolution: Resolution
      notes?: string
      partialAmountCents?: number
    }

    if (!resolution) {
      return NextResponse.json(
        { success: false, error: 'Resolution is required' },
        { status: 400 }
      )
    }

    const validResolutions: Resolution[] = ['REFUND_BUYER', 'RELEASE_TO_SELLER', 'PARTIAL_REFUND']
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resolution' },
        { status: 400 }
      )
    }

    // Get the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        seller: { select: { id: true, stripeAccountId: true, email: true } },
        buyer: { select: { id: true, email: true } },
        listing: { select: { title: true } },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    if (purchase.escrowStatus !== 'DISPUTED') {
      return NextResponse.json(
        { success: false, error: 'This purchase is not in dispute' },
        { status: 400 }
      )
    }

    if (!purchase.stripePaymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'No payment intent found for this purchase' },
        { status: 400 }
      )
    }

    let newEscrowStatus: 'RELEASED' | 'REFUNDED' = 'RELEASED'
    let transferResult: { success: boolean; transferId?: string; error?: string } | undefined
    let refundResult: { success: boolean; refundId?: string; error?: string } | undefined

    try {
      switch (resolution) {
        case 'REFUND_BUYER':
          // Full refund to buyer
          refundResult = await refundBuyer(purchase.stripePaymentIntentId, purchaseId, 'Dispute resolved in buyer favor')
          if (!refundResult.success) {
            return NextResponse.json(
              { success: false, error: refundResult.error || 'Failed to process refund' },
              { status: 500 }
            )
          }
          newEscrowStatus = 'REFUNDED'
          break

        case 'RELEASE_TO_SELLER':
          // Release full amount to seller
          if (!purchase.seller.stripeAccountId) {
            return NextResponse.json(
              { success: false, error: 'Seller has no Stripe account' },
              { status: 400 }
            )
          }
          transferResult = await releaseToSellerByPaymentIntent(
            purchase.stripePaymentIntentId,
            purchase.seller.stripeAccountId,
            purchase.sellerAmountCents,
            purchaseId
          )
          if (!transferResult.success) {
            return NextResponse.json(
              { success: false, error: transferResult.error || 'Failed to release funds' },
              { status: 500 }
            )
          }
          newEscrowStatus = 'RELEASED'
          break

        case 'PARTIAL_REFUND': {
          // Validate partial amount
          if (!partialAmountCents || partialAmountCents <= 0) {
            return NextResponse.json(
              { success: false, error: 'Partial amount must be greater than 0' },
              { status: 400 }
            )
          }
          if (partialAmountCents >= purchase.amountPaidCents) {
            return NextResponse.json(
              { success: false, error: 'Partial amount must be less than total paid. Use REFUND_BUYER for full refunds.' },
              { status: 400 }
            )
          }

          // Validate seller has Stripe account for remaining payout
          if (!purchase.seller.stripeAccountId) {
            return NextResponse.json(
              { success: false, error: 'Seller has no Stripe account for remaining payout' },
              { status: 400 }
            )
          }

          // 1. Refund partial amount to buyer
          refundResult = await refundBuyerPartial(
            purchase.stripePaymentIntentId,
            partialAmountCents,
            purchaseId,
            'Dispute resolved with partial refund'
          )
          if (!refundResult.success) {
            return NextResponse.json(
              { success: false, error: `Refund failed: ${refundResult.error}` },
              { status: 500 }
            )
          }

          // 2. Calculate seller payout (remaining amount minus platform fee)
          const remainingAmount = purchase.amountPaidCents - partialAmountCents
          const platformFee = calculatePlatformFee(remainingAmount)
          const sellerPayout = remainingAmount - platformFee

          // 3. Transfer remaining to seller if there's enough after fees
          if (sellerPayout > 0) {
            transferResult = await releaseToSellerByPaymentIntent(
              purchase.stripePaymentIntentId,
              purchase.seller.stripeAccountId,
              sellerPayout,
              purchaseId
            )
            if (!transferResult.success) {
              // Log but don't fail - refund already issued to buyer
              // Seller transfer failure is recoverable - admin can manually retry
              log.error('Seller transfer failed after partial refund', {
                purchaseId,
                error: transferResult.error,
                refundId: refundResult?.refundId,
                partialAmountCents,
              })
            }
          }

          // Use RELEASED status to indicate funds have been distributed
          newEscrowStatus = 'RELEASED'
          break
        }
      }
    } catch (stripeError) {
      log.error('Stripe operation failed during dispute resolution', {
        purchaseId,
        resolution,
        error: stripeError instanceof Error ? stripeError.message : String(stripeError),
      })
      return NextResponse.json(
        { success: false, error: 'Payment processing failed' },
        { status: 500 }
      )
    }

    // Update purchase and create audit log atomically
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          escrowStatus: newEscrowStatus,
          escrowReleasedAt: newEscrowStatus === 'RELEASED' ? new Date() : null,
          stripeTransferId: transferResult?.transferId,
          stripeRefundId: refundResult?.refundId,
          resolvedAt: new Date(),
          resolvedBy: session.user.id,
          resolution: `${resolution}${notes ? ': ' + notes : ''}`,
        },
      })

      // Log the action in same transaction
      await tx.auditLog.create({
        data: {
          action: 'DISPUTE_RESOLVED',
          entityType: 'PURCHASE',
          entityId: purchaseId,
          actorId: session.user.id,
          metadata: {
            resolution,
            notes,
            escrowStatus: newEscrowStatus,
            amountCents: purchase.amountPaidCents,
            partialRefundCents: resolution === 'PARTIAL_REFUND' ? partialAmountCents : undefined,
            transferId: transferResult?.transferId,
            refundId: refundResult?.refundId,
          },
        },
      })

      return updated
    })

    // GITHUB_ISSUE: Add dispute resolution notification emails
    // When admin resolves a dispute, send email notifications to:
    // - Buyer: notify them of the resolution and what it means for them
    // - Seller: notify them of the resolution and next steps
    // Include: resolution type, refund/payout amounts, any notes
    // Implementation: Create sendDisputeResolvedEmail() in src/lib/email.ts

    // Send Twilio alert
    await alertDisputeResolved(purchase.listing.title, resolution)

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: updatedPurchase.id,
        escrowStatus: updatedPurchase.escrowStatus,
        resolution: updatedPurchase.resolution,
        resolvedAt: updatedPurchase.resolvedAt,
      },
    })
  } catch (error) {
    log.error('POST /api/admin/disputes/[purchaseId]/resolve error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: 'Failed to resolve dispute' },
      { status: 500 }
    )
  }
}
