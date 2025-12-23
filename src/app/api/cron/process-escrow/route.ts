import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { releaseToSellerByPaymentIntent } from '@/lib/stripe-transfers'

// GET /api/cron/process-escrow - Auto-release expired escrows
// Called by cron-job.org every hour
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.warn('CRON_SECRET not configured, allowing request')
    } else if (authHeader !== `Bearer ${cronSecret}`) {
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

    console.log(`[process-escrow] Found ${expiredEscrows.length} expired escrows to process`)

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
        console.warn(`[process-escrow] Purchase ${purchase.id} has no payment intent, skipping`)
        results.errors.push(`${purchase.id}: No payment intent`)
        results.failed++
        continue
      }

      // Skip if seller has no Stripe account
      if (!purchase.seller.stripeAccountId) {
        console.warn(`[process-escrow] Purchase ${purchase.id} seller has no Stripe account, skipping`)
        results.errors.push(`${purchase.id}: Seller has no Stripe account`)
        results.failed++
        continue
      }

      try {
        // Release funds to seller
        const transferResult = await releaseToSellerByPaymentIntent(
          purchase.stripePaymentIntentId,
          purchase.seller.stripeAccountId,
          purchase.sellerAmountCents,
          purchase.id
        )

        if (!transferResult.success) {
          console.error(`[process-escrow] Failed to release ${purchase.id}: ${transferResult.error}`)
          results.errors.push(`${purchase.id}: ${transferResult.error}`)
          results.failed++
          continue
        }

        // Update purchase status
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            escrowStatus: 'RELEASED',
            escrowReleasedAt: new Date(),
          },
        })

        console.log(`[process-escrow] Released escrow for purchase ${purchase.id}`)
        results.released++
      } catch (error) {
        console.error(`[process-escrow] Error processing ${purchase.id}:`, error)
        results.errors.push(`${purchase.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.failed++
      }
    }

    console.log(`[process-escrow] Complete: ${results.released} released, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('[process-escrow] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
