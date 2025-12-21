import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PayoutHistory } from '@/components/payments/payout-history'
import { StripeConnectButton, StripeConnectStatus } from '@/components/payments/stripe-connect-button'
import { getAccountBalance, getPayouts, createDashboardLink, getAccountStatus } from '@/lib/stripe'

export const metadata = {
  title: 'Payouts',
}

export default async function DashboardPayoutsPage() {
  const session = await auth()

  // Get user's Stripe info
  let user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      stripeAccountId: true,
      stripeOnboarded: true,
      stripePayoutsEnabled: true,
    },
  })

  // Auto-sync Stripe status if account exists but not marked as onboarded
  if (user?.stripeAccountId && !user.stripeOnboarded) {
    try {
      const status = await getAccountStatus(user.stripeAccountId)
      if (status.isOnboarded) {
        // Update database with current Stripe status
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeOnboarded: status.isOnboarded,
            stripePayoutsEnabled: status.payoutsEnabled,
          },
          select: {
            id: true,
            stripeAccountId: true,
            stripeOnboarded: true,
            stripePayoutsEnabled: true,
          },
        })
      }
    } catch (error) {
      console.error('Failed to sync Stripe status:', error)
    }
  }

  // If not connected, show connect prompt
  if (!user?.stripeAccountId) {
    return (
      <div>
        <h1 className="font-display text-2xl mb-6">Payouts</h1>
        <div className="card">
          <h2 className="font-display text-lg mb-4">Connect Stripe to Get Paid</h2>
          <p className="text-text-secondary mb-6">
            Connect your Stripe account to receive payouts from your sales.
          </p>
          <StripeConnectButton isConnected={false} />
        </div>
      </div>
    )
  }

  // Fetch Stripe data
  let balance = { available: 0, pending: 0 }
  let payouts: Awaited<ReturnType<typeof getPayouts>> = []
  let dashboardUrl = ''

  try {
    if (user.stripeOnboarded) {
      [balance, payouts, dashboardUrl] = await Promise.all([
        getAccountBalance(user.stripeAccountId),
        getPayouts(user.stripeAccountId),
        createDashboardLink(user.stripeAccountId),
      ])
    }
  } catch (error) {
    console.error('Failed to fetch Stripe data:', error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Payouts</h1>
        <StripeConnectStatus
          isConnected={!!user.stripeAccountId}
          payoutsEnabled={user.stripePayoutsEnabled}
        />
      </div>

      {!user.stripeOnboarded ? (
        <div className="card">
          <h2 className="font-display text-lg mb-4 text-accent-yellow">
            Complete Your Stripe Setup
          </h2>
          <p className="text-text-secondary mb-6">
            You&apos;ve started connecting Stripe, but haven&apos;t completed the setup.
            Finish the onboarding to start receiving payouts.
          </p>
          <StripeConnectButton isConnected={false} />
        </div>
      ) : (
        <>
          {/* Stripe dashboard link */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base mb-1">Stripe Dashboard</h2>
                <p className="text-sm text-text-muted">
                  Manage your account, view detailed reports, and update payout settings.
                </p>
              </div>
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                Open Stripe Dashboard →
              </a>
            </div>
          </div>

          {/* Balance and payout history */}
          <div className="card">
            <PayoutHistory
              payouts={payouts}
              availableBalance={balance.available}
              pendingBalance={balance.pending}
            />
          </div>
        </>
      )}
    </div>
  )
}
