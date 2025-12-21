import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cron/expire-featured - Expire featured listings that have passed their end date
// This endpoint should be called by a cron job (e.g., Vercel Cron)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (required)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Require valid authorization - if CRON_SECRET is not set, endpoint is blocked
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Update all expired featured listings
    const expiredListings = await prisma.listing.updateMany({
      where: {
        featured: true,
        featuredUntil: {
          not: null,
          lt: now,
        },
      },
      data: {
        featured: false,
      },
    })

    // Update all expired featured purchases
    const expiredPurchases = await prisma.featuredPurchase.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    console.log(
      `Cron: Expired ${expiredListings.count} listings and ${expiredPurchases.count} featured purchases`
    )

    return NextResponse.json({
      success: true,
      expiredListings: expiredListings.count,
      expiredPurchases: expiredPurchases.count,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron expire-featured error:', error)
    return NextResponse.json(
      { error: 'Failed to expire featured listings' },
      { status: 500 }
    )
  }
}
