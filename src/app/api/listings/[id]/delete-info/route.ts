import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/listings/[id]/delete-info - Get delete eligibility info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        sellerId: true,
        deliveryMethod: true,
        purchases: {
          where: { status: { in: ['PENDING', 'COMPLETED'] } },
          select: { status: true }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Only seller or admin can view delete info
    if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const hasPendingPurchases = listing.purchases.some(p => p.status === 'PENDING')
    const hasCompletedPurchases = listing.purchases.some(p => p.status === 'COMPLETED')
    const purchaseCount = listing.purchases.length

    return NextResponse.json({
      success: true,
      data: {
        canHardDelete: !hasPendingPurchases && !hasCompletedPurchases,
        canSoftDelete: !hasPendingPurchases,
        hasPendingPurchases,
        hasCompletedPurchases,
        purchaseCount,
        deliveryMethod: listing.deliveryMethod
      }
    })
  } catch (error) {
    console.error('GET /api/listings/[id]/delete-info error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delete info' },
      { status: 500 }
    )
  }
}
