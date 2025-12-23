import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canDispute } from '@/lib/escrow'
import { alertDisputeOpened } from '@/lib/twilio'
import { DisputeReason } from '@prisma/client'

// POST /api/purchases/[purchaseId]/dispute - Buyer opens a dispute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
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

    // Update purchase to disputed status
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        escrowStatus: 'DISPUTED',
        disputedAt: new Date(),
        disputeReason: reason,
        disputeNotes: notes || null,
      },
    })

    // Update seller's dispute count
    await prisma.user.update({
      where: { id: purchase.sellerId },
      data: {
        totalDisputes: { increment: 1 },
      },
    })

    // Recalculate dispute rate
    const seller = await prisma.user.findUnique({
      where: { id: purchase.sellerId },
      select: { totalSales: true, totalDisputes: true },
    })
    if (seller && seller.totalSales > 0) {
      const disputeRate = seller.totalDisputes / seller.totalSales
      await prisma.user.update({
        where: { id: purchase.sellerId },
        data: { disputeRate },
      })
    }

    // TODO: Send notification emails (Phase 4)

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
    console.error('POST /api/purchases/[purchaseId]/dispute error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to open dispute' },
      { status: 500 }
    )
  }
}
