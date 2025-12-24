import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/admin/disputes - List all disputes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'DISPUTED' | 'RESOLVED' | 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on status filter
    let where: Prisma.PurchaseWhereInput
    if (status === 'RESOLVED') {
      where = { resolvedAt: { not: null } }
    } else if (status === 'all' || !status) {
      where = { disputedAt: { not: null } }
    } else {
      where = { escrowStatus: 'DISPUTED' }
    }

    const [disputes, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          buyer: {
            select: {
              id: true,
              username: true,
              email: true,
              buyerTier: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              sellerTier: true,
              totalDisputes: true,
              disputeRate: true,
            },
          },
        },
        orderBy: { disputedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        disputes: disputes.map((d) => ({
          id: d.id,
          listing: d.listing,
          buyer: d.buyer,
          seller: d.seller,
          amountPaidCents: d.amountPaidCents,
          sellerAmountCents: d.sellerAmountCents,
          escrowStatus: d.escrowStatus,
          disputedAt: d.disputedAt,
          disputeReason: d.disputeReason,
          disputeNotes: d.disputeNotes,
          resolvedAt: d.resolvedAt,
          resolvedBy: d.resolvedBy,
          resolution: d.resolution,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('GET /api/admin/disputes error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    )
  }
}
