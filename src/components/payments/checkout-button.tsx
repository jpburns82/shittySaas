'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { formatPrice } from '@/lib/utils'
import { fetchWithCSRF } from '@/lib/fetch-with-csrf'

interface CheckoutButtonProps {
  listingId: string
  listingTitle: string
  priceInCents: number
  priceType: string
  disabled?: boolean
  guestEmail?: string
}

export function CheckoutButton({
  listingId,
  listingTitle: _listingTitle,
  priceInCents,
  priceType,
  disabled,
  guestEmail,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithCSRF('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, guestEmail }),
      })

      const data = await res.json()

      if (data.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        setError(data.error || 'Failed to create checkout session')
        console.error('Failed to create checkout session:', data.error || 'Unknown error')
      }
    } catch (err) {
      setError('Checkout failed. Please try again.')
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (priceType === 'FREE') {
    const handleClaim = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchWithCSRF('/api/purchases/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, guestEmail }),
        })

        const data = await res.json()

        if (data.success) {
          window.location.href = `/purchase/success?purchaseId=${data.data.purchaseId}`
        } else {
          setError(data.error || 'Failed to claim listing')
        }
      } catch (err) {
        setError('Failed to claim. Please try again.')
        console.error('Claim error:', err)
      } finally {
        setLoading(false)
      }
    }

    return (
      <div>
        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-accent-red text-sm">
            {error}
          </div>
        )}
        <Button onClick={handleClaim} variant="primary" loading={loading} disabled={disabled}>
          Get for Free
        </Button>
      </div>
    )
  }

  if (priceType === 'CONTACT') {
    return (
      <Button disabled variant="default">
        Contact Seller
      </Button>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-accent-red text-sm">
          {error}
        </div>
      )}
      <Button onClick={handleCheckout} variant="primary" loading={loading} disabled={disabled}>
        Buy Now — {formatPrice(priceInCents)}
      </Button>
    </div>
  )
}

// Compact version for listings
export function QuickBuyButton({ listingId, priceInCents }: {
  listingId: string
  priceInCents: number
}) {
  const [loading, setLoading] = useState(false)

  const handleQuickBuy = async () => {
    setLoading(true)
    try {
      const res = await fetchWithCSRF('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      const data = await res.json()
      if (data.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('Quick buy failed:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Quick buy error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleQuickBuy}
      disabled={loading}
      className="btn btn-primary text-xs px-2 py-1"
    >
      {loading ? '...' : formatPrice(priceInCents)}
    </button>
  )
}
