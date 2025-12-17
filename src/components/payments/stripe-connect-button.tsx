'use client'

import { useState } from 'react'
import { Button } from '../ui/button'

interface StripeConnectButtonProps {
  isConnected?: boolean
  dashboardUrl?: string
}

export function StripeConnectButton({ isConnected, dashboardUrl }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      } else {
        console.error('Failed to get onboarding URL')
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isConnected && dashboardUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-accent-green">✓</span>
          <span>Stripe Connected</span>
        </div>
        <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm">Open Stripe Dashboard</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-muted">
        Connect your Stripe account to receive payments from sales.
      </p>
      <Button onClick={handleConnect} loading={loading} variant="primary">
        Connect Stripe Account
      </Button>
    </div>
  )
}

// Status indicator
export function StripeConnectStatus({ isConnected, payoutsEnabled }: {
  isConnected: boolean
  payoutsEnabled: boolean
}) {
  if (!isConnected) {
    return (
      <div className="badge badge-yellow">
        Stripe Not Connected
      </div>
    )
  }

  if (!payoutsEnabled) {
    return (
      <div className="badge badge-yellow">
        Stripe Setup Incomplete
      </div>
    )
  }

  return (
    <div className="badge badge-green">
      ✓ Payouts Enabled
    </div>
  )
}
