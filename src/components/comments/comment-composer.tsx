'use client'

import { useState, useRef, useEffect } from 'react'
import { COMMENT_LIMITS } from '@/lib/constants'
import type { Comment } from './comment-section'

interface CommentComposerProps {
  listingId: string
  parentId?: string
  onCommentAdded: (comment: Comment) => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentComposer({
  listingId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = 'Add your whisper to the crypt...',
  autoFocus = false,
}: CommentComposerProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxLength = COMMENT_LIMITS.MAX_CONTENT_LENGTH
  const remaining = maxLength - content.length
  const isNearLimit = remaining <= 50
  const isAtLimit = remaining <= 0

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isAtLimit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setContent('')
        onCommentAdded(data.data)
      } else {
        setError(data.error || 'Failed to post comment')
      }
    } catch {
      setError('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={isSubmitting}
          className="w-full bg-bg-grave border border-border-crypt rounded-none p-4 text-text-bone placeholder-text-dust resize-none focus:outline-none focus:border-accent-electric focus:ring-1 focus:ring-accent-electric/50 disabled:opacity-50 font-mono text-sm"
        />

        {/* Character counter */}
        <div
          className={`absolute bottom-3 right-3 text-xs font-mono ${
            isAtLimit
              ? 'text-accent-bury'
              : isNearLimit
                ? 'text-yellow-500'
                : 'text-text-dust'
          }`}
        >
          {remaining}
        </div>
      </div>

      {error && (
        <p className="text-accent-bury text-sm mt-2">{error}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-text-dust text-xs font-mono">
          Ctrl+Enter to submit
        </span>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn text-sm px-4 py-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isAtLimit || isSubmitting}
            className="btn btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Post Whisper'}
          </button>
        </div>
      </div>
    </form>
  )
}
