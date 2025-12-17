'use client'

import { useState } from 'react'

interface SuspendThreadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  threadId: string
}

export function SuspendThreadModal({
  isOpen,
  onClose,
  onSuccess,
  threadId,
}: SuspendThreadModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/messages/${threadId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim() || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
        onClose()
        setReason('')
      } else {
        setError(data.error || 'Failed to suspend thread')
      }
    } catch {
      setError('Failed to suspend thread')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-primary border border-border-dark w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-dark">
          <h2 className="font-display text-lg text-accent-red">Suspend Conversation</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-red-50 border border-accent-red p-3 text-sm">
            <p className="font-medium text-accent-red mb-2">Warning</p>
            <p className="text-text-secondary">
              Suspending this conversation will prevent both parties from sending new messages.
              The thread will remain visible for review.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Internal Note <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for suspension (for admin records)..."
              className="input w-full min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-text-muted mt-1">{reason.length}/500 characters</p>
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border-dark">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary px-4 py-2 bg-accent-red border-accent-red hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Suspending...' : 'Suspend Thread'}
          </button>
        </div>
      </div>
    </div>
  )
}
