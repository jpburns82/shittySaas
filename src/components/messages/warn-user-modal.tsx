'use client'

import { useState } from 'react'

const WARNING_REASONS = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SCAM', label: 'Suspected Scam' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'OTHER', label: 'Other' },
] as const

interface WarnUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  threadId: string
  userId: string
  username: string
  userRole: 'buyer' | 'seller'
}

export function WarnUserModal({
  isOpen,
  onClose,
  onSuccess,
  threadId,
  userId,
  username,
  userRole,
}: WarnUserModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/messages/${threadId}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reason,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
        onClose()
        // Reset form
        setReason('')
        setNotes('')
      } else {
        setError(data.error || 'Failed to send warning')
      }
    } catch {
      setError('Failed to send warning')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-border-light rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="font-display text-lg">
            Warn @{username} <span className="text-text-muted text-sm">({userRole})</span>
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason <span className="text-accent-red">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a reason...</option>
              {WARNING_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Notes <span className="text-text-muted">(sent to user)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide additional context..."
              className="input w-full min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-text-muted mt-1">{notes.length}/500 characters</p>
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border-light">
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
            disabled={loading || !reason}
          >
            {loading ? 'Sending...' : 'Send Warning'}
          </button>
        </div>
      </div>
    </div>
  )
}
