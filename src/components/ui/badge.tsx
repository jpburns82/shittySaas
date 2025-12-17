import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green' | 'yellow' | 'red' | 'blue'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        {
          'badge-green': variant === 'green',
          'badge-yellow': variant === 'yellow',
          'badge-red': variant === 'red',
          'badge-blue': variant === 'blue',
        },
        className
      )}
      {...props}
    />
  )
}

// Specific badge variants
export function VerifiedBadge() {
  return (
    <Badge variant="green" className="inline-flex items-center gap-1">
      <span>✓</span>
      <span>Verified Seller</span>
    </Badge>
  )
}

export function NewBadge() {
  return (
    <span className="badge-new">NEW!</span>
  )
}

export function FeaturedBadge() {
  return (
    <span className="featured-marker">★ FEATURED</span>
  )
}

export function PurchasedBadge() {
  return (
    <Badge variant="blue">
      Purchased
    </Badge>
  )
}

export function SellerBadge() {
  return (
    <Badge variant="yellow">
      Seller
    </Badge>
  )
}
