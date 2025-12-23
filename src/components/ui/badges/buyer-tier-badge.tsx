import { cn } from '@/lib/utils'
import type { BuyerTier } from '@prisma/client'

interface BuyerTierBadgeProps {
  tier: BuyerTier
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const tierConfig = {
  NEW: {
    label: 'New Buyer',
    shortLabel: 'New',
    icon: null,
    className: 'bg-zinc-700/30 border-zinc-500 text-zinc-300',
  },
  VERIFIED: {
    label: 'Verified Buyer',
    shortLabel: 'Verified',
    icon: '✓',
    className: 'badge-blue',
  },
  TRUSTED: {
    label: 'Trusted Buyer',
    shortLabel: 'Trusted',
    icon: '★',
    className: 'badge-green glow-green-subtle',
  },
}

export function BuyerTierBadge({
  tier,
  size = 'md',
  showLabel = true,
  className,
}: BuyerTierBadgeProps) {
  const config = tierConfig[tier]

  return (
    <span
      className={cn(
        'badge inline-flex items-center gap-1',
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        className
      )}
    >
      {config.icon && <span>{config.icon}</span>}
      {showLabel && <span>{size === 'sm' ? config.shortLabel : config.label}</span>}
    </span>
  )
}
