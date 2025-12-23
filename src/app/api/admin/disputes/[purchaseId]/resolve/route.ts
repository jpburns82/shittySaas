import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { releaseToSellerByPaymentIntent, refundBuyer } from '@/lib/stripe-transfers'
import { alertDisputeResolved } from '@/lib/twilio'

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
    let transferResult

    try {
      switch (resolution) {
        case 'REFUND_BUYER':
          // Full refund to buyer
          await refundBuyer(purchase.stripePaymentIntentId, purchaseId, 'Dispute resolved in buyer favor')
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

        case 'PARTIAL_REFUND':
          // Partial refund - not fully implemented yet
          // Would need to calculate and process partial refund + partial release
          return NextResponse.json(
            { success: false, error: 'Partial refunds not yet implemented' },
            { status: 501 }
          )
      }
    } catch (stripeError) {
      console.error('Stripe operation failed:', stripeError)
      return NextResponse.json(
        { success: false, error: 'Payment processing failed' },
        { status: 500 }
      )
    }

    // Update purchase with resolution
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        escrowStatus: newEscrowStatus,
        escrowReleasedAt: newEscrowStatus === 'RELEASED' ? new Date() : null,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolution: `${resolution}${notes ? ': ' + notes : ''}`,
      },
    })

    // Log the action
    await prisma.auditLog.create({
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
        },
      },
    })

    // TODO: Send notification emails (Phase 4)

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
    console.error('POST /api/admin/disputes/[purchaseId]/resolve error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resolve dispute' },
      { status: 500 }
    )
  }
}
