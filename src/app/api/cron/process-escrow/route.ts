import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { releaseToSellerByPaymentIntent } from '@/lib/stripe-transfers'
import { createLogger } from '@/lib/logger'

const log = createLogger('process-escrow')

// GET /api/cron/process-escrow - Auto-release expired escrows
// Called by cron-job.org every hour
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

    // Find all purchases with expired escrow that need release
    const expiredEscrows = await prisma.purchase.findMany({
      where: {
        escrowStatus: 'HOLDING',
        escrowExpiresAt: {
          lte: new Date(),
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            stripeAccountId: true,
          },
        },
        listing: {
          select: {
            title: true,
          },
        },
      },
    })

    log.info('Found expired escrows to process', { count: expiredEscrows.length })

    const results = {
      processed: 0,
      released: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const purchase of expiredEscrows) {
      results.processed++

      // Skip if no payment intent
      if (!purchase.stripePaymentIntentId) {
        log.warn('Purchase has no payment intent, skipping', { purchaseId: purchase.id })
        results.errors.push(`${purchase.id}: No payment intent`)
        results.failed++
        continue
      }

      // Skip if seller has no Stripe account
      if (!purchase.seller.stripeAccountId) {
        log.warn('Seller has no Stripe account, skipping', { purchaseId: purchase.id })
        results.errors.push(`${purchase.id}: Seller has no Stripe account`)
        results.failed++
        continue
      }

      try {
        // Idempotency check: skip if already transferred (from initial query)
        if (purchase.stripeTransferId) {
          log.info('Purchase already transferred, skipping', {
            purchaseId: purchase.id,
            transferId: purchase.stripeTransferId,
          })
          continue
        }

        // Release funds to seller
        const transferResult = await releaseToSellerByPaymentIntent(
          purchase.stripePaymentIntentId,
          purchase.seller.stripeAccountId,
          purchase.sellerAmountCents,
          purchase.id
        )

        if (!transferResult.success) {
          log.error('Failed to release escrow', {
            purchaseId: purchase.id,
            error: transferResult.error,
          })
          results.errors.push(`${purchase.id}: ${transferResult.error}`)
          results.failed++
          continue
        }

        // ATOMIC UPDATE: Only update if stripeTransferId is still null
        // This prevents race conditions with concurrent cron jobs
        const updateResult = await prisma.purchase.updateMany({
          where: {
            id: purchase.id,
            stripeTransferId: null,
            escrowStatus: 'HOLDING',
          },
          data: {
            escrowStatus: 'RELEASED',
            escrowReleasedAt: new Date(),
            stripeTransferId: transferResult.transferId,
          },
        })

        if (updateResult.count === 0) {
          // Another job already processed this purchase
          log.warn('Purchase was processed by another job, skipping', {
            purchaseId: purchase.id,
            transferId: transferResult.transferId,
          })
          continue
        }

        log.info('Released escrow for purchase', {
          purchaseId: purchase.id,
          transferId: transferResult.transferId,
        })
        results.released++
      } catch (error) {
        log.error('Error processing purchase', {
          purchaseId: purchase.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        results.errors.push(`${purchase.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.failed++
      }
    }

    log.info('Escrow processing complete', {
      released: results.released,
      failed: results.failed,
    })

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    log.error('Fatal error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
