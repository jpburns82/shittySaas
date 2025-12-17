'use client'

import { useRef, useEffect } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MessageWithUsers } from '@/types/user'

interface MessageThreadProps {
  messages: MessageWithUsers[]
  currentUserId: string
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <p>No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isMe = message.senderId === currentUserId
        const sender = isMe ? 'You' : message.sender.displayName || `@${message.sender.username}`

        return (
          <div
            key={message.id}
            className={cn(
              'max-w-[80%]',
              isMe ? 'ml-auto' : 'mr-auto'
            )}
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn('text-xs font-medium', isMe ? 'text-right' : '')}>
                {sender}
              </span>
              <span className="text-xs text-text-muted">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
            <div
              className={cn(
                'p-3 border',
                isMe
                  ? 'bg-accent-blue text-white border-accent-blue'
                  : 'bg-bg-secondary border-border-dark'
              )}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

// Conversation header
interface ThreadHeaderProps {
  otherUser: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  listing?: {
    title: string
    slug: string
  } | null
}

export function ThreadHeader({ otherUser, listing }: ThreadHeaderProps) {
  return (
    <div className="p-4 border-b border-border-dark bg-bg-secondary">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-btn-bg border border-border-dark flex items-center justify-center font-display">
          {otherUser.displayName?.[0] || otherUser.username[0].toUpperCase()}
        </div>
        <div>
          <div className="font-medium">
            @{otherUser.username}
            {otherUser.displayName && (
              <span className="text-text-muted font-normal ml-2">
                ({otherUser.displayName})
              </span>
            )}
          </div>
          {listing && (
            <div className="text-xs text-text-muted">
              Re: {listing.title}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
