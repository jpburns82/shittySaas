import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'
import { TIME_MS, STALE_THRESHOLDS } from '@/lib/constants'

const log = createLogger('cleanup-pending')

// GET /api/cron/cleanup-pending - Clean up stale pending purchases
// Called by cron-job.org daily
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Require valid authorization - reject if CRON_SECRET not set
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate threshold based on configured stale hours
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLDS.PENDING_PURCHASE_HOURS * TIME_MS.HOUR)

    // Find stale pending purchases
    const stalePurchases = await prisma.purchase.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: staleThreshold,
        },
      },
      select: {
        id: true,
        createdAt: true,
        listing: {
          select: {
            title: true,
          },
        },
      },
    })

    log.info('Found stale pending purchases', { count: stalePurchases.length })

    if (stalePurchases.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          deleted: 0,
          message: 'No stale purchases to clean up',
        },
      })
    }

    // Delete stale purchases
    const deleteResult = await prisma.purchase.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: staleThreshold,
        },
      },
    })

    log.info('Deleted stale pending purchases', { count: deleteResult.count })

    // Log the deleted purchases for audit purposes
    for (const purchase of stalePurchases) {
      log.debug('Deleted purchase', { id: purchase.id, title: purchase.listing.title, createdAt: purchase.createdAt.toISOString() })
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleteResult.count,
        purchaseIds: stalePurchases.map(p => p.id),
      },
    })
  } catch (error) {
    log.error('Fatal error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { success: false, error: 'Cleanup job failed' },
      { status: 500 }
    )
  }
}
