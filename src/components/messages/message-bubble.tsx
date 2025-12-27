'use client'

import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MessageWithAttachments } from '@/types/user'
import { AttachmentDisplay } from './attachment-display'
import { Trash2 } from 'lucide-react'

interface MessageBubbleProps {
  message: MessageWithAttachments
  currentUserId: string
  onDelete?: (messageId: string) => void
}

export function MessageBubble({ message, currentUserId, onDelete }: MessageBubbleProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isMe = message.senderId === currentUserId
  const sender = message.sender
  const isAdmin = sender.isAdmin

  const handleDelete = async () => {
    if (isDeleting) return
    if (!confirm('Delete this message? This only removes it from your view.')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/messages/${message.id}`, { method: 'DELETE' })
      if (res.ok && onDelete) {
        onDelete(message.id)
      }
    } catch {
      console.error('Failed to delete message')
    } finally {
      setIsDeleting(false)
    }
  }

  // Determine sender display name (used for display/accessibility)
  const _senderName = isMe
    ? 'You'
    : sender.displayName || `@${sender.username}`

  // Style variants based on sender type
  const getBubbleStyles = () => {
    if (isMe) {
      return 'bg-accent-blue/10 border-l-4 border-l-accent-blue border-y border-r border-border-dark'
    }
    if (isAdmin) {
      return 'bg-accent-red/10 border-l-4 border-l-accent-red border-y border-r border-border-dark'
    }
    return 'bg-bg-secondary border border-border-dark'
  }

  return (
    <div className="w-full group">
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

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-accent-red disabled:opacity-50"
          title="Delete message (only for you)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Message Body */}
      <div className={cn('p-3', getBubbleStyles())}>
        <p className="whitespace-pre-wrap text-sm break-words">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentDisplay attachments={message.attachments} />
        )}
      </div>
    </div>
  )
}
