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
}

export function CheckoutButton({
  listingId,
  listingTitle: _listingTitle,
  priceInCents,
  priceType,
  disabled,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetchWithCSRF('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        console.error('Failed to create checkout session:', data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (priceType === 'FREE') {
    return (
      <Button onClick={handleCheckout} variant="primary" loading={loading} disabled={disabled}>
        Get for Free
      </Button>
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
    <Button onClick={handleCheckout} variant="primary" loading={loading} disabled={disabled}>
      Buy Now — {formatPrice(priceInCents)}
    </Button>
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
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
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
