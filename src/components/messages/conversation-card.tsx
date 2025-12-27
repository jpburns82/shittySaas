'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface ConversationCardProps {
  conversationKey: string
  otherUser: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isAdmin: boolean
  }
  listing: {
    id: string
    title: string
    slug: string
  } | null
  lastMessage: {
    id: string
    content: string
    senderId: string
    createdAt: Date
    sender: {
      id: string
      username: string
      isAdmin: boolean
    }
  }
  unreadCount: number
  currentUserId: string
  onDelete?: () => void
}

export function ConversationCard({
  otherUser,
  listing,
  lastMessage,
  unreadCount,
  currentUserId,
  onDelete,
}: ConversationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  const isSystem = lastMessage.sender.isAdmin && lastMessage.sender.id !== currentUserId

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDeleting) return
    if (!confirm('Delete this conversation? Messages will be hidden from your inbox.')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/messages/conversation/${otherUser.id}${listing ? `?listingId=${listing.id}` : ''}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setIsDeleted(true)
        onDelete?.()
      }
    } catch {
      console.error('Failed to delete conversation')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isDeleted) return null

  return (
    <Link
      href={`/dashboard/messages/${otherUser.id}${listing ? `?listing=${listing.id}` : ''}`}
      className="block group"
    >
      <div
        className={`card flex items-start gap-4 hover:bg-bg-accent relative ${
          unreadCount > 0 ? 'bg-accent-blue/10' : ''
        } ${isSystem ? 'bg-secondary' : ''}`}
      >
        {/* Blue dot indicator for unread */}
        {unreadCount > 0 && (
          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-accent-blue" />
        )}

        {/* Avatar */}
        {isSystem ? (
          <div className="w-12 h-12 bg-btn-bg border border-border-dark flex items-center justify-center text-lg ml-2">
            <span>&#9881;</span>
          </div>
        ) : (
          <div className="w-12 h-12 bg-btn-bg border border-border-dark flex items-center justify-center font-display text-lg ml-2">
            {otherUser.displayName?.[0] || otherUser.username[0].toUpperCase()}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isSystem ? (
              <span className="font-medium text-text-muted">SYSTEM</span>
            ) : (
              <span className={`font-medium ${unreadCount > 0 ? 'font-bold' : ''}`}>
                @{otherUser.username}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="bg-accent-blue text-white text-xs px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          {listing && (
            <div className={`text-xs text-text-muted ${unreadCount > 0 ? 'font-semibold' : ''}`}>
              Re: {listing.title}
            </div>
          )}
          <div className="text-sm text-text-muted truncate mt-1">
            {lastMessage.senderId === currentUserId && (
              <span className="text-text-secondary">You: </span>
            )}
            {lastMessage.content.slice(0, 80)}
            {lastMessage.content.length > 80 && '...'}
          </div>
        </div>

        {/* Time + Delete */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs text-text-muted">
            {formatRelativeTime(lastMessage.createdAt)}
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-text-muted/50 hover:text-accent-red transition-colors disabled:opacity-50 p-1"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}
