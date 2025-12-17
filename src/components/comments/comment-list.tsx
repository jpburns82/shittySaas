'use client'

import { Comment } from './comment-section'
import { CommentItem } from './comment-item'
import { COMMENT_LIMITS } from '@/lib/constants'

interface CommentListProps {
  comments: Comment[]
  listingId: string
  listingOwnerId: string
  currentUserId?: string
  onCommentUpdated: (comment: Comment) => void
  onCommentDeleted: (commentId: string) => void
  onReplyAdded: (parentId: string, reply: Comment) => void
  depth?: number
}

export function CommentList({
  comments,
  listingId,
  listingOwnerId,
  currentUserId,
  onCommentUpdated,
  onCommentDeleted,
  onReplyAdded,
  depth = 0,
}: CommentListProps) {
  const maxDepth = COMMENT_LIMITS.MAX_THREAD_DEPTH

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border-crypt pl-4' : ''}>
      {comments.map((comment) => (
        <div key={comment.id} className="mb-4">
          <CommentItem
            comment={comment}
            listingId={listingId}
            listingOwnerId={listingOwnerId}
            currentUserId={currentUserId}
            onCommentUpdated={onCommentUpdated}
            onCommentDeleted={onCommentDeleted}
            onReplyAdded={onReplyAdded}
            canReply={depth < maxDepth - 1 && !!currentUserId}
            depth={depth}
          />

          {/* Render nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <CommentList
              comments={comment.replies}
              listingId={listingId}
              listingOwnerId={listingOwnerId}
              currentUserId={currentUserId}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
