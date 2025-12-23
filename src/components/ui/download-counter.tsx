import { cn } from '@/lib/utils'

interface DownloadCounterProps {
  used: number
  max: number
  className?: string
}

export function DownloadCounter({ used, max, className }: DownloadCounterProps) {
  const remaining = max - used
  const isWarning = remaining <= 2 && remaining > 0
  const isExhausted = remaining <= 0

  return (
    <div
      className={cn(
        'font-mono text-sm',
        isExhausted && 'text-accent-red',
        isWarning && !isExhausted && 'text-accent-yellow',
        !isWarning && !isExhausted && 'text-text-muted',
        className
      )}
    >
      {isExhausted ? (
        <span className="inline-flex items-center gap-1">
          <span>✕</span>
          <span>No downloads remaining</span>
        </span>
      ) : isWarning ? (
        <span className="inline-flex items-center gap-1">
          <span>⚠</span>
          <span>{used}/{max} downloads used</span>
        </span>
      ) : (
        <span>Downloads: {used}/{max}</span>
      )}
    </div>
  )
}
