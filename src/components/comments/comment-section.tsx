'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CommentList } from './comment-list'
import { CommentComposer } from './comment-composer'
import { JP_ACCENTS } from '@/lib/constants'

export interface CommentAuthor {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  isVerifiedSeller: boolean
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editedAt: string | null
  isVerifiedPurchase: boolean
  isSeller: boolean
  isHiddenBySeller: boolean
  isRemoved: boolean
  parentId: string | null
  author: CommentAuthor
  replies: Comment[]
}

interface CommentSectionProps {
  listingId: string
  listingOwnerId: string
  initialCommentCount: number
}

export function CommentSection({
  listingId,
  listingOwnerId,
  initialCommentCount,
}: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [totalCount, setTotalCount] = useState(initialCommentCount)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/listings/${listingId}/comments`)
      const data = await res.json()

      if (data.success) {
        setComments(data.data.comments)
        setTotalCount(data.data.totalCount)
      } else {
        setError(data.error || 'Failed to load comments')
      }
    } catch {
      setError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [...prev, { ...newComment, replies: [] }])
    setTotalCount((prev) => prev + 1)
  }

  const handleCommentUpdated = (updatedComment: Comment) => {
    const updateInTree = (commentList: Comment[]): Comment[] => {
      return commentList.map((comment) => {
        if (comment.id === updatedComment.id) {
          return { ...updatedComment, replies: comment.replies }
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: updateInTree(comment.replies) }
        }
        return comment
      })
    }
    setComments(updateInTree)
  }

  const handleCommentDeleted = (commentId: string) => {
    const removeFromTree = (commentList: Comment[]): Comment[] => {
      return commentList
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: removeFromTree(comment.replies),
        }))
    }
    setComments(removeFromTree)
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  const handleReplyAdded = (parentId: string, reply: Comment) => {
    const addReplyToTree = (commentList: Comment[]): Comment[] => {
      return commentList.map((comment) => {
        if (comment.id === parentId) {
          return { ...comment, replies: [...comment.replies, { ...reply, replies: [] }] }
        }
        if (comment.replies.length > 0) {
          return { ...comment, replies: addReplyToTree(comment.replies) }
        }
        return comment
      })
    }
    setComments(addReplyToTree)
    setTotalCount((prev) => prev + 1)
  }

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-text-dust text-sm jp-accent">{JP_ACCENTS.FORUM}</span>
          <h2 className="font-display text-xl text-accent-reanimate">
            FORUM
          </h2>
        </div>
        <span className="text-text-muted font-mono text-sm">
          {totalCount} {totalCount === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comment Composer or Login Prompt */}
      {session ? (
        <CommentComposer
          listingId={listingId}
          onCommentAdded={handleCommentAdded}
        />
      ) : (
        <div className="bg-bg-grave border border-border-crypt p-6 mb-6 text-center">
          <p className="text-text-bone mb-3">
            💀 Sign in to join the conversation
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="btn btn-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Divider */}
      <hr className="border-border-crypt my-6" />

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-text-muted font-mono">
            <span className="jp-accent">{JP_ACCENTS.LOADING}</span>
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-accent-bury">{error}</p>
          <button
            onClick={fetchComments}
            className="btn mt-3"
          >
            Try Again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <pre className="text-text-muted text-sm mb-4 font-mono">
{`     _____
    /     \\
   | () () |
    \\  ^  /
     |||||`}
          </pre>
          <p className="text-text-dust jp-accent mb-2">{JP_ACCENTS.NOTHING_HERE}</p>
          <p className="text-text-muted">
            No comments yet. Start the conversation.
          </p>
        </div>
      ) : (
        <CommentList
          comments={comments}
          listingId={listingId}
          listingOwnerId={listingOwnerId}
          currentUserId={session?.user?.id}
          onCommentUpdated={handleCommentUpdated}
          onCommentDeleted={handleCommentDeleted}
          onReplyAdded={handleReplyAdded}
        />
      )}
    </section>
  )
}
