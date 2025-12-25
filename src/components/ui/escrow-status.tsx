'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface EscrowStatusProps {
  status: 'HOLDING' | 'DISPUTED' | 'RELEASED' | 'REFUNDED'
  expiresAt: Date | string | null
  canDispute?: boolean
  onDisputeClick?: () => void
  showProgressBar?: boolean
  className?: string
}

function getTimeRemaining(expiresAt: Date | string): {
  total: number
  days: number
  hours: number
  minutes: number
  formatted: string
} {
  const now = new Date().getTime()
  const expiry = new Date(expiresAt).getTime()
  const total = Math.max(0, expiry - now)

  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))

  let formatted = ''
  if (days > 0) formatted = `${days}d ${hours}h`
  else if (hours > 0) formatted = `${hours}h ${minutes}m`
  else if (minutes > 0) formatted = `${minutes}m`
  else formatted = 'Releasing soon'

  return { total, days, hours, minutes, formatted }
}

export function EscrowStatus({
  status,
  expiresAt,
  canDispute = false,
  onDisputeClick,
  showProgressBar = true,
  className,
}: EscrowStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    total: number
    days: number
    hours: number
    minutes: number
    formatted: string
  } | null>(null)

  // Calculate time after mount to avoid hydration mismatch
  useEffect(() => {
    if (expiresAt && status === 'HOLDING') {
      setTimeRemaining(getTimeRemaining(expiresAt))
    }
  }, [expiresAt, status])

  // Update countdown every minute
  useEffect(() => {
    if (!expiresAt || status !== 'HOLDING') return

    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt))
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [expiresAt, status])

  // Calculate progress percentage (assuming 72h default escrow)
  const getProgressPercent = (): number => {
    if (!expiresAt || !timeRemaining) return 0
    // Assume 72 hour max for progress calculation
    const maxMs = 72 * 60 * 60 * 1000
    const percent = Math.min(100, (timeRemaining.total / maxMs) * 100)
    return Math.max(0, percent)
  }

  const progressPercent = getProgressPercent()
  const isWarning = progressPercent > 0 && progressPercent <= 25
  const isCritical = progressPercent > 0 && progressPercent <= 10

  if (status === 'RELEASED') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="green" className="inline-flex items-center gap-1">
          <span>✓</span>
          <span>Funds released to seller</span>
        </Badge>
      </div>
    )
  }

  if (status === 'REFUNDED') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="blue" className="inline-flex items-center gap-1">
          <span>↩</span>
          <span>Refunded to buyer</span>
        </Badge>
      </div>
    )
  }

  if (status === 'DISPUTED') {
    return (
      <div className={cn('space-y-2', className)}>
        <Badge variant="yellow" className="inline-flex items-center gap-1">
          <span>⚠</span>
          <span>Dispute in progress</span>
        </Badge>
        <p className="text-xs text-text-muted">
          Our team is reviewing this dispute. You&apos;ll be notified when resolved.
        </p>
      </div>
    )
  }

  // HOLDING status
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="green" className="inline-flex items-center gap-1">
            <span>🛡️</span>
            <span>Protected</span>
          </Badge>
          {timeRemaining && (
            <span className="text-sm font-mono text-text-muted">
              {timeRemaining.formatted} remaining
            </span>
          )}
        </div>

        {canDispute && onDisputeClick && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDisputeClick}
            className="text-xs"
          >
            Report Issue
          </Button>
        )}
      </div>

      {showProgressBar && timeRemaining && timeRemaining.total > 0 && (
        <div className="escrow-progress">
          <div
            className={cn(
              'escrow-progress-bar',
              isWarning && 'warning',
              isCritical && 'critical'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <p className="text-xs text-text-muted">
        Funds are held securely until the protection period ends or you confirm receipt.
      </p>
    </div>
  )
}
