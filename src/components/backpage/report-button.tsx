'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ReportModal } from './report-modal'

interface ReportButtonProps {
  type: 'post' | 'reply'
  slug: string
  replyId?: string
  authorId: string
  className?: string
}

export function ReportButton({ type, slug, replyId, authorId, className }: ReportButtonProps) {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Don't show report button if not logged in or if user is the author
  if (!session?.user || session.user.id === authorId) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`text-text-muted hover:text-accent-red text-xs transition-colors ${className || ''}`}
        title={`Report ${type}`}
      >
        Report
      </button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        slug={slug}
        replyId={replyId}
      />
    </>
  )
}
