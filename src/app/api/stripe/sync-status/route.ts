import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccountStatus } from '@/lib/stripe'

// POST /api/stripe/sync-status - Manually sync Stripe account status
export async function POST() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'No Stripe account connected' },
        { status: 400 }
      )
    }

    // Fetch current status from Stripe
    const status = await getAccountStatus(user.stripeAccountId)

    // Update database with current Stripe status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeOnboarded: status.isOnboarded,
        stripePayoutsEnabled: status.payoutsEnabled,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        isOnboarded: status.isOnboarded,
        payoutsEnabled: status.payoutsEnabled,
        chargesEnabled: status.chargesEnabled,
      },
    })
  } catch (error) {
    console.error('POST /api/stripe/sync-status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync Stripe status' },
      { status: 500 }
    )
  }
}
