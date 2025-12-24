import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createConnectAccount, createAccountLink } from '@/lib/stripe'

// POST /api/stripe/connect - Start Stripe Connect onboarding
export async function POST(_request: NextRequest) {
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
      select: { stripeAccountId: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    let accountId = user.stripeAccountId

    // Create Stripe Connect account if not exists
    if (!accountId) {
      const account = await createConnectAccount(session.user.id, user.email!)
      accountId = account.id

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: accountId },
      })
    }

    // Create onboarding link - use configured app URL, not request origin (which may be localhost behind proxy)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://undeadlist.com'
    const accountLinkUrl = await createAccountLink(
      accountId,
      `${appUrl}/dashboard/payouts`
    )

    return NextResponse.json({
      success: true,
      data: { url: accountLinkUrl },
    })
  } catch (error) {
    console.error('POST /api/stripe/connect error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}
