import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canDispute } from '@/lib/escrow'
import { alertDisputeOpened } from '@/lib/twilio'
import { sendDisputeOpenedSellerEmail, sendDisputeOpenedBuyerConfirmEmail } from '@/lib/email'
import { DisputeReason } from '@prisma/client'
import { validateCSRF } from '@/lib/csrf'
import { createLogger } from '@/lib/logger'

const logger = createLogger('dispute')

// POST /api/purchases/[purchaseId]/dispute - Buyer opens a dispute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { purchaseId } = await params
    const body = await request.json()
    const { reason, notes } = body as { reason: DisputeReason; notes?: string }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Dispute reason is required' },
        { status: 400 }
      )
    }

    // Validate dispute reason
    const validReasons: DisputeReason[] = [
      'FILES_EMPTY',
      'NOT_AS_DESCRIBED',
      'SELLER_UNRESPONSIVE',
      'SUSPECTED_STOLEN',
      'MALWARE',
      'OTHER',
    ]
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid dispute reason' },
        { status: 400 }
      )
    }

    // Get the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        listing: { select: { title: true } },
        seller: { select: { email: true, username: true } },
        buyer: { select: { id: true, email: true, username: true } },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify user is the buyer
    if (purchase.buyerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the buyer can open a dispute' },
        { status: 403 }
      )
    }

    // Check if dispute is allowed (escrow still holding, not expired)
    if (!canDispute(purchase.escrowStatus, purchase.escrowExpiresAt)) {
      return NextResponse.json(
        { success: false, error: 'Cannot dispute this purchase. Escrow may have already been released.' },
        { status: 400 }
      )
    }

    // Wrap all dispute operations in a single transaction for atomicity
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // 1. Update purchase to disputed status
      const disputedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          escrowStatus: 'DISPUTED',
          disputedAt: new Date(),
          disputeReason: reason,
          disputeNotes: notes || null,
        },
      })

      // 2. Get current seller stats, increment, and recalculate rate atomically
      const seller = await tx.user.findUnique({
        where: { id: purchase.sellerId },
        select: { totalSales: true, totalDisputes: true },
      })

      const newDisputeCount = (seller?.totalDisputes || 0) + 1
      const disputeRate = seller && seller.totalSales > 0
        ? newDisputeCount / seller.totalSales
        : 0

      await tx.user.update({
        where: { id: purchase.sellerId },
        data: {
          totalDisputes: newDisputeCount,
          disputeRate,
        },
      })

      return disputedPurchase
    })

    // Send dispute notification emails (non-blocking)
    const buyerEmail = purchase.buyer?.email || session.user.email
    const buyerUsername = purchase.buyer?.username || session.user.username || 'Unknown'

    if (purchase.seller.email) {
      sendDisputeOpenedSellerEmail(
        purchase.seller.email,
        purchase.listing.title,
        reason,
        buyerUsername,
        notes
      ).catch((err) => logger.error('Failed to send seller dispute email', { err }))
    }

    if (buyerEmail) {
      sendDisputeOpenedBuyerConfirmEmail(
        buyerEmail,
        purchase.listing.title,
        notes
      ).catch((err) => logger.error('Failed to send buyer dispute confirm email', { err }))
    }

    // Send Twilio alert to admin
    await alertDisputeOpened(
      purchase.listing.title,
      reason,
      purchase.buyer?.username || session.user.username || 'Unknown'
    )

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: updatedPurchase.id,
        escrowStatus: updatedPurchase.escrowStatus,
        disputedAt: updatedPurchase.disputedAt,
        disputeReason: updatedPurchase.disputeReason,
      },
    })
  } catch (error) {
    logger.error('Failed to open dispute', { error })
    return NextResponse.json(
      { success: false, error: 'Failed to open dispute' },
      { status: 500 }
    )
  }
}
