'use client'

import { useState, useCallback } from 'react'

interface UseStripeConnectReturn {
  startOnboarding: () => Promise<void>
  loading: boolean
  error: string | null
}

export function useStripeConnect(): UseStripeConnectReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOnboarding = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success && data.data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.data.url
      } else {
        setError(data.error || 'Failed to start Stripe onboarding')
      }
    } catch {
      setError('Failed to start Stripe onboarding')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    startOnboarding,
    loading,
    error,
  }
}

interface UseCheckoutOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UseCheckoutReturn {
  checkout: (listingId: string, guestEmail?: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutReturn {
  const { onSuccess, onError } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkout = useCallback(
    async (listingId: string, guestEmail?: string) => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, guestEmail }),
        })

        const data = await res.json()

        if (data.success && data.data.url) {
          onSuccess?.()
          // Redirect to Stripe checkout
          window.location.href = data.data.url
        } else {
          const err = data.error || 'Failed to create checkout session'
          setError(err)
          onError?.(err)
        }
      } catch {
        const err = 'Failed to create checkout session'
        setError(err)
        onError?.(err)
      } finally {
        setLoading(false)
      }
    },
    [onSuccess, onError]
  )

  return {
    checkout,
    loading,
    error,
  }
}

// Re-export for convenience
export { useStripeConnect as useStripeOnboarding }
