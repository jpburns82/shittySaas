'use client'

import { useState, useEffect, useCallback } from 'react'

interface Message {
  id: string
  content: string
  createdAt: string
  readAt: string | null
  senderId: string
  receiverId: string
  sender: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  listing?: {
    id: string
    title: string
    slug: string
  } | null
}

interface UseMessagesOptions {
  userId?: string
  listingId?: string
  autoFetch?: boolean
  pollInterval?: number
}

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<boolean>
  refreshMessages: () => Promise<void>
  sending: boolean
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { userId, listingId, autoFetch = true, pollInterval } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('userId', userId)
      if (listingId) params.set('listingId', listingId)

      const res = await fetch(`/api/messages?${params}`)
      const data = await res.json()

      if (data.success) {
        setMessages(data.data)
      } else {
        setError(data.error || 'Failed to fetch messages')
      }
    } catch {
      setError('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [userId, listingId])

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!userId) return false

      setSending(true)
      setError(null)

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: userId,
            content,
            listingId,
          }),
        })

        const data = await res.json()

        if (data.success) {
          // Add new message to list
          setMessages((prev) => [...prev, data.data])
          return true
        } else {
          setError(data.error || 'Failed to send message')
          return false
        }
      } catch {
        setError('Failed to send message')
        return false
      } finally {
        setSending(false)
      }
    },
    [userId, listingId]
  )

  // Initial fetch
  useEffect(() => {
    if (autoFetch && userId) {
      fetchMessages()
    }
  }, [fetchMessages, autoFetch, userId])

  // Polling for new messages
  useEffect(() => {
    if (!pollInterval || !userId) return

    const interval = setInterval(fetchMessages, pollInterval)
    return () => clearInterval(interval)
  }, [pollInterval, fetchMessages, userId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: fetchMessages,
    sending,
  }
}

// Hook for unread message count
export function useUnreadCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()

        if (data.success) {
          // Count unread messages where user is receiver
          const unread = data.data.filter(
            (m: Message) => !m.readAt
          ).length
          setCount(unread)
        }
      } catch {
        // Silently fail
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  return count
}
