'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { Zap, Skull, ArrowLeft, Send, Trash2 } from 'lucide-react'
import { CATEGORY_LABELS, BACKPAGE_LIMITS } from '@/lib/backpage'

interface Reply {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    username: string
    sellerTier: string
  }
}

interface Post {
  id: string
  title: string
  body: string
  slug: string
  category: string
  upvotes: number
  downvotes: number
  replyCount: number
  createdAt: string
  expiresAt: string
  userVote: number
  author: {
    id: string
    username: string
    sellerTier: string
  }
  replies: Reply[]
}

interface BackPagePostDetailProps {
  post: Post
}

export function BackPagePostDetail({ post }: BackPagePostDetailProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [votes, setVotes] = useState({ up: post.upvotes, down: post.downvotes })
  const [userVote, setUserVote] = useState(post.userVote)
  const [replies, setReplies] = useState(post.replies)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = session?.user?.id === post.author.id
  const isAdmin = session?.user?.isAdmin

  const handleVote = async (value: 1 | -1) => {
    if (!session?.user) {
      router.push('/login?callbackUrl=/backpage/' + post.slug)
      return
    }

    const res = await fetch(`/api/backpage/${post.slug}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })

    if (res.ok) {
      const data = await res.json()
      setVotes({ up: data.data.upvotes, down: data.data.downvotes })
      setUserVote(data.data.userVote)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmitting) return

    if (!session?.user) {
      router.push('/login?callbackUrl=/backpage/' + post.slug)
      return
    }

    setIsSubmitting(true)
    const res = await fetch(`/api/backpage/${post.slug}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent }),
    })

    if (res.ok) {
      const data = await res.json()
      setReplies([...replies, data.data])
      setReplyContent('')
    }
    setIsSubmitting(false)
  }

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setIsDeleting(true)
    const res = await fetch(`/api/backpage/${post.slug}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      router.push('/backpage')
    } else {
      setIsDeleting(false)
      alert('Failed to delete post')
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return

    const res = await fetch(`/api/backpage/${post.slug}/reply/${replyId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setReplies(replies.filter((r) => r.id !== replyId))
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/backpage"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-6"
        >
          <ArrowLeft size={16} />
          Back to バックページ
        </Link>

        {/* Post */}
        <article className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-text-secondary">
              {CATEGORY_LABELS[post.category] || post.category}
            </span>
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="text-text-tertiary hover:text-red-400 transition-colors"
                title="Delete post"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <h1 className="text-xl font-bold text-white mb-4">{post.title}</h1>

          <div className="prose prose-invert max-w-none mb-4">
            <p className="text-text-secondary whitespace-pre-wrap">{post.body}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>@{post.author.username}</span>
              <span className="text-accent-cyan">[{post.author.sellerTier}]</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                  userVote === 1
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-text-secondary'
                }`}
              >
                <Zap size={14} />
                {votes.up}
              </button>
              <button
                onClick={() => handleVote(-1)}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                  userVote === -1
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-text-secondary'
                }`}
              >
                <Skull size={14} />
                {votes.down}
              </button>
            </div>
          </div>
        </article>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">
            Replies ({replies.length})
          </h2>

          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-text-secondary whitespace-pre-wrap flex-1">
                  {reply.body}
                </p>
                {(session?.user?.id === reply.author.id || isAdmin) && (
                  <button
                    onClick={() => handleDeleteReply(reply.id)}
                    className="text-text-tertiary hover:text-red-400 transition-colors ml-2"
                    title="Delete reply"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span>@{reply.author.username}</span>
                <span className="text-accent-cyan">[{reply.author.sellerTier}]</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}

          {/* Reply form */}
          {session?.user ? (
            <form onSubmit={handleReply} className="mt-6">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-text-tertiary resize-none focus:border-accent-cyan focus:outline-none"
                rows={3}
                maxLength={BACKPAGE_LIMITS.REPLY_MAX}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-text-tertiary">
                  {replyContent.length}/{BACKPAGE_LIMITS.REPLY_MAX}
                </span>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-black font-medium rounded-lg hover:bg-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} />
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
              <p className="text-text-secondary">
                <Link href={`/login?callbackUrl=/backpage/${post.slug}`} className="text-accent-cyan hover:underline">
                  Sign in
                </Link>
                {' '}to reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
