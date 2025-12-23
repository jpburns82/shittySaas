import { cn } from '@/lib/utils'
import type { SellerTier } from '@prisma/client'

interface SellerTierBadgeProps {
  tier: SellerTier
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const tierConfig = {
  NEW: {
    label: 'New Seller',
    shortLabel: 'New',
    variant: 'default' as const,
    icon: null,
    className: 'bg-zinc-700/30 border-zinc-500 text-zinc-300',
  },
  VERIFIED: {
    label: 'Verified Seller',
    shortLabel: 'Verified',
    variant: 'blue' as const,
    icon: '✓',
    className: 'badge-blue',
  },
  TRUSTED: {
    label: 'Trusted Seller',
    shortLabel: 'Trusted',
    variant: 'green' as const,
    icon: '★',
    className: 'badge-green glow-green-subtle',
  },
  PRO: {
    label: 'Pro Seller',
    shortLabel: 'Pro',
    variant: 'yellow' as const,
    icon: '⚡',
    className: 'badge-tier-pro',
  },
}

export function SellerTierBadge({
  tier,
  size = 'md',
  showLabel = true,
  className,
}: SellerTierBadgeProps) {
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
