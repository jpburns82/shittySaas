import { cn } from '@/lib/utils'

interface ProtectedBadgeProps {
  escrowHours?: number
  className?: string
}

export function ProtectedBadge({
  escrowHours = 72,
  className,
}: ProtectedBadgeProps) {
  // Format hours into a readable duration
  const formatDuration = (hours: number): string => {
    if (hours === 0) return 'Instant'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <span
      className={cn(
        'protected-badge inline-flex items-center gap-1.5 text-xs font-mono',
        className
      )}
      title="Your purchase is protected by our escrow system"
    >
      <span>🛡️</span>
      <span>{formatDuration(escrowHours)} Buyer Protection</span>
    </span>
  )
}
