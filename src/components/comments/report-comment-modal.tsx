'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { COMMENT_LIMITS } from '@/lib/constants'

interface ReportCommentModalProps {
  isOpen: boolean
  onClose: () => void
  commentId: string
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment or abuse' },
  { value: 'MISLEADING', label: 'Misleading information' },
  { value: 'SCAM', label: 'Scam or fraud' },
  { value: 'MALWARE', label: 'Malware or malicious content' },
  { value: 'STOLEN_CODE', label: 'Stolen code discussion' },
  { value: 'ILLEGAL', label: 'Illegal content' },
  { value: 'COPYRIGHT', label: 'Copyright violation' },
  { value: 'OTHER', label: 'Other' },
] as const

export function ReportCommentModal({
  isOpen,
  onClose,
  commentId,
}: ReportCommentModalProps) {
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const maxDetailsLength = COMMENT_LIMITS.MAX_REPORT_DETAILS_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      setError('Please select a reason')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to submit report')
      }
    } catch {
      setError('Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDetails('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Comment"
      size="sm"
    >
      {success ? (
        <div className="text-center py-4">
          <p className="text-accent-reanimate font-medium">Report submitted</p>
          <p className="text-text-dust text-sm mt-2">
            Thank you for helping keep the crypt clean.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Reason Select */}
          <div className="mb-4">
            <label className="block text-text-bone text-sm mb-2">
              Reason for report <span className="text-accent-bury">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-bg-grave border border-border-crypt p-2 text-text-bone text-sm focus:outline-none focus:border-accent-electric"
            >
              <option value="">Select a reason...</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Details Textarea */}
          <div className="mb-4">
            <label className="block text-text-bone text-sm mb-2">
              Additional details (optional)
            </label>
            <div className="relative">
              <textarea
                value={details}
                onChange={(e) =>
                  setDetails(e.target.value.slice(0, maxDetailsLength))
                }
                rows={3}
                placeholder="Provide any additional context..."
                className="w-full bg-bg-grave border border-border-crypt p-2 text-text-bone text-sm resize-none focus:outline-none focus:border-accent-electric placeholder-text-dust"
              />
              <span className="absolute bottom-2 right-2 text-text-dust text-xs">
                {maxDetailsLength - details.length}
              </span>
            </div>
          </div>

          {error && <p className="text-accent-bury text-sm mb-4">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isSubmitting}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
