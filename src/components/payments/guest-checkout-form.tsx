'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { formatPrice } from '@/lib/utils'
import { fetchWithCSRF } from '@/lib/fetch-with-csrf'

interface GuestCheckoutFormProps {
  listingId: string
  listingTitle: string
  priceInCents: number
  priceType: string
}

export function GuestCheckoutForm({
  listingId,
  listingTitle: _listingTitle,
  priceInCents,
  priceType,
}: GuestCheckoutFormProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCheckout = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setEmailError('')

    try {
      const res = await fetchWithCSRF('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, guestEmail: email }),
      })

      const data = await res.json()

      if (data.success && data.data?.url) {
        window.location.href = data.data.url
      } else {
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError('Checkout failed. Please try again.')
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setEmailError('')

    try {
      const res = await fetchWithCSRF('/api/purchases/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, guestEmail: email }),
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

  if (priceType === 'FREE') {
    return (
      <div>
        <div className="mb-4">
          <label htmlFor="guest-email" className="block text-sm font-medium text-text-secondary mb-2">
            Email for download link
          </label>
          <input
            id="guest-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError('')
            }}
            placeholder="your@email.com"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            required
          />
          {emailError && (
            <p className="text-accent-red text-sm mt-1">{emailError}</p>
          )}
          <p className="text-xs text-text-muted mt-1">
            Download link will be sent to this email
          </p>
        </div>
        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-accent-red text-sm">
            {error}
          </div>
        )}
        <Button onClick={handleClaim} variant="primary" loading={loading} disabled={!email.trim()}>
          Get for Free
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="guest-email" className="block text-sm font-medium text-text-secondary mb-2">
          Email for download link
        </label>
        <input
          id="guest-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError('')
          }}
          placeholder="your@email.com"
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
          required
        />
        {emailError && (
          <p className="text-accent-red text-sm mt-1">{emailError}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          Download link will be sent to this email
        </p>
      </div>
      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-accent-red text-sm">
          {error}
        </div>
      )}
      <Button onClick={handleCheckout} variant="primary" loading={loading} disabled={!email.trim()}>
        Buy Now — {formatPrice(priceInCents)}
      </Button>
    </div>
  )
}
