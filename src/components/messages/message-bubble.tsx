'use client'

import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MessageWithAttachments } from '@/types/user'
import { AttachmentDisplay } from './attachment-display'

interface MessageBubbleProps {
  message: MessageWithAttachments
  currentUserId: string
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isMe = message.senderId === currentUserId
  const sender = message.sender
  const isAdmin = sender.isAdmin

  // Determine sender display name (used for display/accessibility)
  const _senderName = isMe
    ? 'You'
    : sender.displayName || `@${sender.username}`

  // Style variants based on sender type
  const getBubbleStyles = () => {
    if (isMe) {
      return 'bg-[#f0f7ff] border-l-4 border-l-accent-blue border-y border-r border-border-dark'
    }
    if (isAdmin) {
      return 'bg-[#fff0f0] border-l-4 border-l-accent-red border-y border-r border-border-dark'
    }
    return 'bg-bg-secondary border border-border-dark'
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        {/* Avatar */}
        <div
          className={cn(
            'w-8 h-8 flex items-center justify-center font-display text-sm border',
            isAdmin
              ? 'bg-accent-red text-white border-accent-red'
              : 'bg-btn-bg border-border-dark'
          )}
        >
          {isAdmin ? '🛡' : (sender.displayName?.[0] || sender.username[0].toUpperCase())}
        </div>

        {/* Username */}
        <span className="text-sm font-medium">
          @{sender.username}
          {sender.displayName && (
            <span className="text-text-muted font-normal ml-1">
              ({sender.displayName})
            </span>
          )}
          {isAdmin && (
            <span className="text-accent-red text-xs ml-1">[Admin]</span>
          )}
        </span>

        {/* Timestamp */}
        <span className="text-xs text-text-muted">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>

      {/* Message Body */}
      <div className={cn('p-3 ml-10', getBubbleStyles())}>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentDisplay attachments={message.attachments} />
        )}
      </div>
    </div>
  )
}
