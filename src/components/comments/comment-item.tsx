'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Comment } from './comment-section'
import { CommentComposer } from './comment-composer'
import { ReportCommentModal } from './report-comment-modal'
import { ConfirmModal } from '@/components/ui/modal'
import { COMMENT_LIMITS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

interface CommentItemProps {
  comment: Comment
  listingId: string
  listingOwnerId: string
  currentUserId?: string
  onCommentUpdated: (comment: Comment) => void
  onCommentDeleted: (commentId: string) => void
  onReplyAdded: (parentId: string, reply: Comment) => void
  canReply: boolean
  depth: number
}

export function CommentItem({
  comment,
  listingId,
  listingOwnerId,
  currentUserId,
  onCommentUpdated,
  onCommentDeleted,
  onReplyAdded,
  canReply,
  depth,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const isOwner = currentUserId === comment.author.id
  const isOP = comment.author.id === listingOwnerId
  const maxDepth = COMMENT_LIMITS.MAX_THREAD_DEPTH

  const handleEdit = async () => {
    if (!editContent.trim()) return

    setEditError(null)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        onCommentUpdated({ ...comment, ...data.data })
        setIsEditing(false)
      } else {
        setEditError(data.error || 'Failed to update comment')
      }
    } catch {
      setEditError('Failed to update comment')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        onCommentDeleted(comment.id)
      }
    } catch {
      // Silent failure - could show toast
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleReplyAdded = (reply: Comment) => {
    onReplyAdded(comment.id, reply)
    setIsReplying(false)
  }

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })

  return (
    <div className={`group ${isOP ? 'op-glow rounded p-3 -ml-3' : ''}`}>
      {/* Comment Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/user/${comment.author.username}`} className="shrink-0">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover border border-border-crypt"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-bg-tombstone border border-border-crypt flex items-center justify-center text-text-dust text-sm font-mono">
              {comment.author.username[0].toUpperCase()}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/user/${comment.author.username}`}
              className="font-medium text-text-bone hover:text-accent-electric"
            >
              {comment.author.displayName || comment.author.username}
            </Link>

            {/* Badges */}
            {isOP && (
              <span className="badge badge-accent text-xs">OP</span>
            )}
            {comment.author.isVerifiedSeller && (
              <span className="badge badge-success text-xs">Verified Seller</span>
            )}
            {comment.isVerifiedPurchase && (
              <span className="badge badge-info text-xs">Verified Purchase</span>
            )}
            {comment.isSeller && !isOP && (
              <span className="badge text-xs">Seller</span>
            )}

            {/* Timestamp */}
            <span className="text-text-dust text-xs">
              {timeAgo}
              {comment.editedAt && ' (edited)'}
            </span>
          </div>

          {/* Content or Edit Form */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) =>
                  setEditContent(e.target.value.slice(0, COMMENT_LIMITS.MAX_CONTENT_LENGTH))
                }
                rows={3}
                className="w-full bg-bg-grave border border-border-crypt p-2 text-text-bone text-sm resize-none focus:outline-none focus:border-accent-electric"
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-xs font-mono ${
                    COMMENT_LIMITS.MAX_CONTENT_LENGTH - editContent.length <= 50
                      ? 'text-accent-bury'
                      : 'text-text-dust'
                  }`}
                >
                  {COMMENT_LIMITS.MAX_CONTENT_LENGTH - editContent.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                      setEditError(null)
                    }}
                    className="btn text-xs px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editContent.trim()}
                    className="btn btn-primary text-xs px-2 py-1"
                  >
                    Save
                  </button>
                </div>
              </div>
              {editError && (
                <p className="text-accent-bury text-xs mt-1">{editError}</p>
              )}
            </div>
          ) : (
            <p className="text-text-bone text-sm mt-1 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Reply */}
              {canReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-text-dust hover:text-accent-electric text-xs"
                >
                  Reply
                </button>
              )}

              {/* Max depth notice */}
              {depth >= maxDepth - 1 && currentUserId && (
                <span className="text-text-dust text-xs">
                  Max depth reached
                </span>
              )}

              {/* Edit (owner only) */}
              {isOwner && !comment.editedAt && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-dust hover:text-accent-electric text-xs"
                >
                  Edit
                </button>
              )}

              {/* Delete (owner only) */}
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-text-dust hover:text-accent-bury text-xs"
                >
                  Delete
                </button>
              )}

              {/* Report (non-owner only) */}
              {currentUserId && !isOwner && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-text-dust hover:text-accent-bury text-xs"
                >
                  Report
                </button>
              )}
            </div>
          )}

          {/* Reply Composer */}
          {isReplying && (
            <div className="mt-3">
              <CommentComposer
                listingId={listingId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
                onCancel={() => setIsReplying(false)}
                placeholder={`Reply to @${comment.author.username}...`}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={isDeleting}
      />

      {/* Report Modal */}
      <ReportCommentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        commentId={comment.id}
      />
    </div>
  )
}
