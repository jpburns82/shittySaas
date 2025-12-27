'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { fetchWithCSRF } from '@/lib/fetch-with-csrf'

type ReportReason = 'SPAM' | 'HARASSMENT' | 'SCAM' | 'OFF_TOPIC' | 'OTHER'

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam or self-promotion',
  HARASSMENT: 'Harassment or abuse',
  SCAM: 'Scam or fraud',
  OFF_TOPIC: 'Off-topic or irrelevant',
  OTHER: 'Other',
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'post' | 'reply'
  slug: string
  replyId?: string
}

export function ReportModal({ isOpen, onClose, type, slug, replyId }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = type === 'post'
        ? `/api/backpage/${slug}/report`
        : `/api/backpage/${slug}/reply/${replyId}/report`

      const response = await fetchWithCSRF(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details: details || undefined }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to submit report')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        // Reset state
        setReason(null)
        setDetails('')
        setSuccess(false)
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setReason(null)
    setDetails('')
    setError('')
    setSuccess(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={success ? 'Report Submitted' : `Report ${type === 'post' ? 'Post' : 'Reply'}`}
      size="sm"
    >
      {success ? (
        <div className="text-center py-4">
          <div className="text-accent-green text-2xl mb-2">✓</div>
          <p className="text-text-muted">
            Thank you for helping keep the community safe. We&apos;ll review this report.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="alert alert-error mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-4">
            <p className="text-sm text-text-muted">Why are you reporting this?</p>
            {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
              <label key={r} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-accent-cyan"
                />
                <span className="text-sm group-hover:text-accent-cyan transition-colors">
                  {REASON_LABELS[r]}
                </span>
              </label>
            ))}
          </div>

          <Textarea
            label="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            placeholder="Provide any additional context..."
            charCount
            className="text-sm"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="danger"
              loading={loading}
              disabled={!reason}
            >
              Submit Report
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
