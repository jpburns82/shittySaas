'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Zap, Skull, MessageSquare } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/backpage'

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
  author: {
    username: string
    sellerTier: string
  }
}

interface BackPageListProps {
  posts: Post[]
}

export function BackPageList({ posts }: BackPageListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No posts yet. Be the first to post!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/backpage/${post.slug}`}
          className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
        >
          <div className="flex gap-4">
            {/* Vote counts */}
            <div className="flex flex-col items-center text-sm min-w-[50px] gap-1">
              <span className="flex items-center gap-1 text-accent-cyan">
                <Zap size={14} />
                {post.upvotes}
              </span>
              <span className="flex items-center gap-1 text-text-tertiary">
                <Skull size={14} />
                {post.downvotes}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-text-secondary">
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
              </div>
              <h3 className="font-medium text-white truncate">{post.title}</h3>
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                {post.body}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                <span>@{post.author.username}</span>
                <span className="text-accent-cyan">[{post.author.sellerTier}]</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {post.replyCount}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
