import { cn } from '@/lib/utils'
import type { ScanStatus } from '@prisma/client'

interface ScanBadgeProps {
  status: ScanStatus
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  PENDING: {
    label: 'Pending scan',
    icon: '○',
    className: 'badge-yellow',
  },
  SCANNING: {
    label: 'Scanning',
    icon: '◌',
    className: 'badge-blue',
    spinning: true,
  },
  CLEAN: {
    label: 'Scanned',
    icon: '✓',
    className: 'badge-green',
  },
  SUSPICIOUS: {
    label: 'Review',
    icon: '⚠',
    className: 'badge-yellow',
  },
  MALICIOUS: {
    label: 'Blocked',
    icon: '✕',
    className: 'badge-red',
  },
  ERROR: {
    label: 'Scan error',
    icon: '!',
    className: 'bg-zinc-700/30 border-zinc-500 text-zinc-300',
  },
  SKIPPED: {
    label: 'Not scanned',
    icon: '–',
    className: 'bg-zinc-700/30 border-zinc-500 text-zinc-300',
  },
}

export function ScanBadge({
  status,
  showLabel = true,
  className,
}: ScanBadgeProps) {
  const config = statusConfig[status]
  const isSpinning = 'spinning' in config && config.spinning

  return (
    <span
      className={cn(
        'badge inline-flex items-center gap-1 text-xs',
        config.className,
        className
      )}
    >
      <span className={isSpinning ? 'scan-spinning' : ''}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
