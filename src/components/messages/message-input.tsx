'use client'

import { useState } from 'react'
import { Button } from '../ui/button'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({
  onSend,
  placeholder = 'Type your message...',
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || loading) return

    setLoading(true)
    try {
      await onSend(trimmed)
      setContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border-dark bg-bg-primary">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="flex-1 min-h-[60px] max-h-[200px] resize-y"
          aria-label="Message content"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!content.trim() || disabled || loading}
          loading={loading}
        >
          Send
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  )
}

// Quick contact form (on listing pages)
interface ContactFormProps {
  sellerId: string
  listingId: string
  listingTitle: string
}

export function ContactForm({ sellerId, listingId, listingTitle }: ContactFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          receiverId: sellerId,
          listingId,
        }),
      })

      if (res.ok) {
        setSent(true)
        setContent('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card text-center">
        <p className="text-accent-green">✓ Message sent!</p>
        <p className="text-sm text-text-muted mt-1">
          The seller will receive your message and can reply via the platform.
        </p>
        <button
          onClick={() => setSent(false)}
          className="btn-link text-sm mt-2"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-display text-base">Contact Seller</h3>
      <p className="text-xs text-text-muted">
        Ask about &quot;{listingTitle}&quot;
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Hi, I have a question about..."
        className="w-full min-h-[80px]"
        required
      />
      <Button type="submit" variant="primary" loading={loading}>
        Send Message
      </Button>
    </form>
  )
}
