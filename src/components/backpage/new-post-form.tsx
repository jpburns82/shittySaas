'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABELS, BACKPAGE_LIMITS } from '@/lib/backpage'

export function NewPostForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const res = await fetch('/api/backpage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      router.push(`/backpage/${data.data.slug}`)
    } else {
      setError(data.error || 'Failed to create post')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === key
                  ? 'bg-accent-cyan text-black'
                  : 'bg-zinc-800 text-text-secondary hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-text-tertiary focus:border-accent-cyan focus:outline-none"
          maxLength={BACKPAGE_LIMITS.TITLE_MAX}
          minLength={BACKPAGE_LIMITS.TITLE_MIN}
          required
        />
        <span className="text-xs text-text-tertiary mt-1 block">
          {title.length}/{BACKPAGE_LIMITS.TITLE_MAX}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, ask a question, or show off your work..."
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-text-tertiary resize-none focus:border-accent-cyan focus:outline-none"
          rows={8}
          maxLength={BACKPAGE_LIMITS.BODY_MAX}
          minLength={BACKPAGE_LIMITS.BODY_MIN}
          required
        />
        <span className="text-xs text-text-tertiary mt-1 block">
          {content.length}/{BACKPAGE_LIMITS.BODY_MAX}
        </span>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-zinc-800 text-text-secondary rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="px-6 py-3 bg-accent-cyan text-black font-medium rounded-lg hover:bg-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <p className="text-xs text-text-tertiary text-center">
        Posts expire every Monday at midnight UTC
      </p>
    </form>
  )
}
