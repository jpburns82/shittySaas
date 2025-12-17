import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PriceBadgeProps {
  priceType: string
  priceInCents: number | null
  minPriceInCents?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriceBadge({
  priceType,
  priceInCents,
  minPriceInCents,
  size = 'md',
  className,
}: PriceBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
  }

  if (priceType === 'FREE') {
    return (
      <span className={cn('price price-free font-bold', sizeClasses[size], className)}>
        FREE
      </span>
    )
  }

  if (priceType === 'CONTACT') {
    return (
      <span className={cn('price price-contact', sizeClasses[size], className)}>
        Contact for price
      </span>
    )
  }

  if (priceType === 'PAY_WHAT_YOU_WANT') {
    const minPrice = formatPrice(minPriceInCents || 0)
    return (
      <span className={cn('price font-bold', sizeClasses[size], className)}>
        {minPriceInCents && minPriceInCents > 0 ? `${minPrice}+` : 'Pay what you want'}
      </span>
    )
  }

  // FIXED price
  return (
    <span className={cn('price font-bold', sizeClasses[size], className)}>
      {formatPrice(priceInCents)}
    </span>
  )
}

// Compact version for listings table
export function PriceCell({ priceType, priceInCents }: Pick<PriceBadgeProps, 'priceType' | 'priceInCents'>) {
  return <PriceBadge priceType={priceType} priceInCents={priceInCents} size="sm" />
}
