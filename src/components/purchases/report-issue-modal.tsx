'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fetchWithCSRF } from '@/lib/fetch-with-csrf'

interface ReportIssueModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
  listingTitle: string
  onSuccess?: () => void
}

const DISPUTE_REASONS = [
  { value: 'FILES_EMPTY', label: 'Downloaded files were empty or corrupted' },
  { value: 'NOT_AS_DESCRIBED', label: "Product doesn't match the listing description" },
  { value: 'SELLER_UNRESPONSIVE', label: 'Seller is not responding' },
  { value: 'SUSPECTED_STOLEN', label: 'Code appears to be stolen' },
  { value: 'MALWARE', label: 'Files contain malware or malicious code' },
  { value: 'OTHER', label: 'Other reason' },
]

export function ReportIssueModal({
  isOpen,
  onClose,
  purchaseId,
  listingTitle,
  onSuccess,
}: ReportIssueModalProps) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for your dispute')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetchWithCSRF(`/api/purchases/${purchaseId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, notes: notes || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit dispute')
      }

      // Success - close modal and notify parent
      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form state
    setReason('')
    setNotes('')
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report an Issue"
      size="md"
      footer={
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="danger"
            loading={loading}
            disabled={!reason}
          >
            Submit Dispute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Report an issue with your purchase of <strong>{listingTitle}</strong>.
          Our team will review your dispute and respond within 24-48 hours.
        </p>

        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red text-accent-red text-sm rounded">
            {error}
          </div>
        )}

        <Select
          label="What's the issue?"
          options={DISPUTE_REASONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Select a reason..."
          required
        />

        <Textarea
          label="Additional details (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Provide any additional context that might help us resolve your issue..."
          rows={4}
          maxLength={1000}
          charCount
        />

        <div className="text-xs text-text-muted p-3 bg-bg-accent rounded border border-border-dark">
          <strong>Note:</strong> Filing a dispute will pause the escrow release until
          our team reviews your case. False or frivolous disputes may result in account
          restrictions.
        </div>
      </div>
    </Modal>
  )
}
