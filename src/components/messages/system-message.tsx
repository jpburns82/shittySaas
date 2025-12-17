'use client'

import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface SystemMessageProps {
  content: string
  createdAt: Date | string
  ctaText?: string
  ctaHref?: string
}

export function SystemMessage({
  content,
  createdAt,
  ctaText,
  ctaHref,
}: SystemMessageProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-[#e8e8e8] border border-border-dark flex items-center justify-center">
          <span>⚙</span>
        </div>
        <span className="text-sm font-medium text-text-muted">SYSTEM</span>
        <span className="text-xs text-text-muted">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      {/* Message Body */}
      <div className="ml-10 p-3 bg-[#e8e8e8] border border-border-dark">
        <p className="text-sm">{content}</p>

        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-block mt-2 text-sm btn-link"
          >
            {ctaText} →
          </Link>
        )}
      </div>
    </div>
  )
}
