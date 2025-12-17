'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageBubble } from '@/components/messages/message-bubble'
import { MessageComposer } from '@/components/messages/message-composer'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { MessageWithAttachments, AttachmentInput } from '@/types/user'

interface ThreadClientProps {
  messages: MessageWithAttachments[]
  currentUserId: string
  recipientId: string
  listingId?: string
  isBlocked: boolean
  blockedByMe: boolean
  isAdmin: boolean
  recipient: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isAdmin: boolean
  }
  reportCount?: number
  lastReport?: { reason: string; createdAt: Date } | null
}

const ADMIN_TEMPLATES = [
  { label: 'Listing flagged for review', content: 'Your listing has been flagged for review by our moderation team. Please ensure it complies with our terms of service.' },
  { label: 'Account warning', content: 'This is a warning regarding your recent activity on the platform. Please review our community guidelines.' },
  { label: 'Payout issue', content: 'We noticed an issue with your payout information. Please update your payment details in Settings.' },
  { label: 'Welcome / onboarding', content: 'Welcome to SideProject.deals! We\'re excited to have you. Let us know if you have any questions.' },
  { label: 'Verification approved', content: 'Great news! Your seller verification has been approved. You now have the verified seller badge.' },
]

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or scam' },
  { value: 'HARASSMENT', label: 'Harassment or abuse' },
  { value: 'SCAM', label: 'Suspicious activity' },
  { value: 'OTHER', label: 'Other' },
]

export function ThreadClient({
  messages: initialMessages,
  currentUserId,
  recipientId,
  listingId,
  isBlocked,
  blockedByMe,
  isAdmin,
  recipient,
  reportCount = 0,
  lastReport,
}: ThreadClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async (content: string, attachments?: AttachmentInput[]) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        receiverId: recipientId,
        listingId,
        attachments,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to send message')
    }

    const data = await res.json()
    setMessages((prev) => [...prev, data.data])
  }

  const handleBlock = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/users/${recipientId}/block`, {
        method: 'POST',
      })

      if (res.ok) {
        setShowBlockModal(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to block user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/users/${recipientId}/block`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'USER',
          userId: recipientId,
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      })

      if (res.ok) {
        setShowReportModal(false)
        setReportReason('')
        setReportDetails('')
      }
    } catch (error) {
      console.error('Failed to report:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto border border-border-dark bg-bg-secondary p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Composer */}
      {!isBlocked && (
        <MessageComposer
          onSend={handleSend}
          isAdmin={isAdmin}
          adminTemplates={isAdmin ? ADMIN_TEMPLATES : undefined}
        />
      )}

      {/* Unblock option */}
      {isBlocked && blockedByMe && (
        <div className="p-4 border-t border-border-dark bg-bg-secondary text-center">
          <Button
            variant="default"
            onClick={handleUnblock}
            loading={actionLoading}
          >
            Unblock @{recipient.username}
          </Button>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border-dark bg-bg-primary text-sm">
        <div>
          {!blockedByMe && (
            <button
              onClick={() => setShowBlockModal(true)}
              className="text-text-muted hover:text-accent-red"
            >
              🚫 Block User
            </button>
          )}
        </div>
        <div>
          <button
            onClick={() => setShowReportModal(true)}
            className="text-text-muted hover:text-accent-red"
          >
            ⚠ Report Conversation
          </button>
        </div>
      </div>

      {/* Admin Tools Panel */}
      {isAdmin && (
        <div className="border border-accent-red bg-red-50 p-3 mt-2">
          <h3 className="font-display text-sm mb-2 text-accent-red">ADMIN TOOLS</h3>
          <div className="flex flex-wrap gap-2 text-xs mb-2">
            <a href={`/user/${recipient.username}`} className="btn-secondary px-2 py-1">
              View Profile
            </a>
            <a href={`/admin/users/${recipientId}`} className="btn-secondary px-2 py-1">
              User Admin
            </a>
          </div>
          {reportCount > 0 && (
            <div className="text-xs text-text-muted mt-2">
              Reports: {reportCount}
              {lastReport && (
                <>
                  {' '}· Last reported: {new Date(lastReport.createdAt).toLocaleDateString()}
                  <br />
                  Reason: &quot;{lastReport.reason}&quot;
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Block Modal */}
      <ConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlock}
        title={`Block @${recipient.username}?`}
        message="They won't be able to send you new messages. Existing conversations will remain visible. You can unblock them later from Settings."
        confirmText="Block User"
        variant="danger"
        loading={actionLoading}
      />

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Conversation"
        size="sm"
        footer={
          <>
            <Button variant="default" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReport}
              disabled={!reportReason}
              loading={actionLoading}
            >
              Submit Report
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm">Why are you reporting this?</p>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label key={reason.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.value}
                  checked={reportReason === reason.value}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span className="text-sm">{reason.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Additional details (optional)..."
            className="w-full min-h-[80px]"
          />
        </div>
      </Modal>
    </>
  )
}
