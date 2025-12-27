'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatRelativeTime } from '@/lib/utils'

type Post = {
  id: string
  slug: string
  title: string
  body: string
  category: 'GENERAL' | 'SHOW_TELL' | 'LOOKING_FOR' | 'HELP'
  status: 'ACTIVE' | 'REMOVED'
  upvotes: number
  downvotes: number
  createdAt: string
  removedAt: string | null
  removalReason: string | null
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isBanned: boolean
  }
  _count: {
    replies: number
    reports: number
  }
}

type Pagination = {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

const CATEGORIES = ['GENERAL', 'SHOW_TELL', 'LOOKING_FOR', 'HELP']
const STATUSES = ['ACTIVE', 'REMOVED']

const categoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    GENERAL: 'General',
    SHOW_TELL: 'Show & Tell',
    LOOKING_FOR: 'Looking For',
    HELP: 'Help',
  }
  return labels[category] || category
}

const statusVariant = (status: string): 'green' | 'red' | 'default' => {
  switch (status) {
    case 'ACTIVE':
      return 'green'
    case 'REMOVED':
      return 'red'
    default:
      return 'default'
  }
}

export default function AdminBackPagePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') || 'all'
  const categoryFilter = searchParams.get('category') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [activeCount, setActiveCount] = useState(0)
  const [pendingReportsCount, setPendingReportsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ open: boolean; post: Post | null }>({
    open: false,
    post: null,
  })

  // Action modal
  const [actionModal, setActionModal] = useState<{
    open: boolean
    post: Post | null
    action: 'remove_post' | 'warn_user' | 'ban_user' | null
  }>({ open: false, post: null, action: null })
  const [actionNotes, setActionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/backpage?${params}`)
      const data = await res.json()
      if (data.success) {
        setPosts(data.data)
        setPagination(data.pagination)
        setActiveCount(data.activeCount)
        setPendingReportsCount(data.pendingReportsCount)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, currentPage])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`/admin/backpage?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/backpage?${params}`)
  }

  const openDetail = async (post: Post) => {
    try {
      const res = await fetch(`/api/admin/backpage/${post.id}`)
      const data = await res.json()
      if (data.success) {
        setDetailModal({ open: true, post: data.data })
      }
    } catch (error) {
      console.error('Failed to fetch post details:', error)
    }
  }

  const _handleRemovePost = async (postId: string, reason: string) => {
    try {
      const res = await fetch(`/api/admin/backpage/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setDetailModal({ open: false, post: null })
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to remove post:', error)
    }
  }

  const handleAction = async () => {
    if (!actionModal.post || !actionModal.action) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/backpage/${actionModal.post.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.action,
          notes: actionNotes,
        }),
      })
      if (res.ok) {
        setActionModal({ open: false, post: null, action: null })
        setActionNotes('')
        setDetailModal({ open: false, post: null })
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to take action:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl">Manage BackPage</h1>
          {pendingReportsCount > 0 && (
            <Link href="/admin/backpage/reports">
              <Badge variant="yellow">{pendingReportsCount} pending reports</Badge>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm">{activeCount} active posts</span>
          <Link href="/admin/backpage/reports">
            <Button size="sm" variant="default">View Reports</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No posts found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Stats</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link
                      href={`/backpage/${post.slug}`}
                      className="hover:underline font-medium truncate max-w-[200px] block"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/user/${post.author.username}`}
                      className="hover:underline text-sm"
                    >
                      @{post.author.username}
                      {post.author.isBanned && (
                        <Badge variant="red" className="ml-1">banned</Badge>
                      )}
                    </Link>
                  </td>
                  <td>
                    <Badge variant="default">{categoryLabel(post.category)}</Badge>
                  </td>
                  <td>
                    <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                  </td>
                  <td className="text-sm text-text-muted">
                    <span title="Votes">⚡{post.upvotes} ⚰️{post.downvotes}</span>
                    <span className="mx-2">·</span>
                    <span title="Replies">{post._count.replies} replies</span>
                    {post._count.reports > 0 && (
                      <>
                        <span className="mx-2">·</span>
                        <span className="text-accent-red" title="Reports">{post._count.reports} reports</span>
                      </>
                    )}
                  </td>
                  <td className="text-text-muted text-sm">
                    {formatRelativeTime(new Date(post.createdAt))}
                  </td>
                  <td>
                    <Button size="sm" variant="default" onClick={() => openDetail(post)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            size="sm"
            variant="default"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="self-center text-sm text-text-muted">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            size="sm"
            variant="default"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, post: null })}
        title="Post Details"
        size="lg"
      >
        {detailModal.post && (
          <div className="space-y-6">
            {/* Post Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted text-sm">Status</span>
                <div className="mt-1">
                  <Badge variant={statusVariant(detailModal.post.status)}>
                    {detailModal.post.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Category</span>
                <div className="mt-1">
                  <Badge variant="default">{categoryLabel(detailModal.post.category)}</Badge>
                </div>
              </div>
            </div>

            {/* Title & Body */}
            <div>
              <span className="text-text-muted text-sm">Title</span>
              <div className="mt-1 font-medium">{detailModal.post.title}</div>
            </div>
            <div>
              <span className="text-text-muted text-sm">Content</span>
              <div className="mt-1 p-3 bg-bg-accent border border-border-dark whitespace-pre-wrap max-h-48 overflow-y-auto">
                {detailModal.post.body}
              </div>
            </div>

            {/* Author Info */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Author</span>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <Link
                    href={`/user/${detailModal.post.author.username}`}
                    className="font-medium hover:underline"
                  >
                    @{detailModal.post.author.username}
                  </Link>
                  {detailModal.post.author.isBanned && (
                    <Badge variant="red" className="ml-2">banned</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Removal Info (if removed) */}
            {detailModal.post.status === 'REMOVED' && detailModal.post.removalReason && (
              <div className="border-t border-border-dark pt-4">
                <span className="text-text-muted text-sm">Removal Reason</span>
                <div className="mt-1 p-3 bg-bg-accent border border-border-dark">
                  {detailModal.post.removalReason}
                </div>
              </div>
            )}

            {/* Actions */}
            {detailModal.post.status === 'ACTIVE' && (
              <div className="border-t border-border-dark pt-4 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      post: detailModal.post,
                      action: 'remove_post',
                    })
                  }
                >
                  Remove Post
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      post: detailModal.post,
                      action: 'warn_user',
                    })
                  }
                >
                  Warn Author
                </Button>
                {!detailModal.post.author.isBanned && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        post: detailModal.post,
                        action: 'ban_user',
                      })
                    }
                  >
                    Ban Author
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => {
          setActionModal({ open: false, post: null, action: null })
          setActionNotes('')
        }}
        title={
          actionModal.action === 'remove_post'
            ? 'Remove Post'
            : actionModal.action === 'warn_user'
            ? 'Warn Author'
            : 'Ban Author'
        }
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            {actionModal.action === 'remove_post' &&
              'This will remove the post from BackPage.'}
            {actionModal.action === 'warn_user' &&
              'This will send a warning to the post author.'}
            {actionModal.action === 'ban_user' &&
              'This will ban the post author from the platform.'}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Reason / Notes</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="input w-full h-24"
              placeholder="Reason for this action..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="default"
              onClick={() => {
                setActionModal({ open: false, post: null, action: null })
                setActionNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionModal.action === 'warn_user' ? 'primary' : 'danger'}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
