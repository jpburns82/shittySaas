import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Text-based loading indicator (retro style)
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'font-mono animate-pulse',
        {
          'text-sm': size === 'sm',
          'text-base': size === 'md',
          'text-lg': size === 'lg',
        },
        className
      )}
      aria-label="Loading"
    >
      [...]
    </span>
  )
}

// Full page loading state
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="font-display text-2xl mb-2">Loading</div>
        <div className="font-mono text-text-muted animate-pulse">
          . . .
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for listing cards
export function ListingCardSkeleton() {
  return (
    <div className="listing-card animate-pulse">
      <div className="h-4 bg-zinc-800 w-3/4 mb-2" />
      <div className="h-3 bg-zinc-800 w-full mb-1" />
      <div className="h-3 bg-zinc-800 w-2/3 mb-3" />
      <div className="h-3 bg-zinc-800 w-1/4" />
    </div>
  )
}

// Skeleton grid
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="listing-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Inline loading text
export function LoadingText({ text = 'Loading' }: { text?: string }) {
  return (
    <span className="font-mono text-text-muted">
      {text}
      <span className="animate-pulse">...</span>
    </span>
  )
}
