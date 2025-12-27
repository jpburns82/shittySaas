'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatRelativeTime } from '@/lib/utils'

type BackPageReport = {
  id: string
  reason: 'SPAM' | 'HARASSMENT' | 'SCAM' | 'OFF_TOPIC' | 'OTHER'
  details: string | null
  status: 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED'
  resolution: string | null
  reviewedAt: string | null
  createdAt: string
  reporter: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  post: {
    id: string
    slug: string
    title: string
    body?: string
    category: string
    status: 'ACTIVE' | 'REMOVED'
    author: {
      id: string
      username: string
      displayName: string | null
      isBanned?: boolean
    }
  } | null
  reply: {
    id: string
    body: string
    status: 'ACTIVE' | 'REMOVED'
    post: {
      slug: string
      title: string
    }
    author: {
      id: string
      username: string
      displayName: string | null
      isBanned?: boolean
    }
  } | null
  reporterHistory?: number
  reportedUserHistory?: {
    reportsAgainst: number
    warnings: number
  } | null
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

const REPORT_REASONS = ['SPAM', 'HARASSMENT', 'SCAM', 'OFF_TOPIC', 'OTHER']
const STATUSES = ['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED']
const TYPES = ['post', 'reply']

const statusVariant = (status: string): 'yellow' | 'blue' | 'green' | 'default' => {
  switch (status) {
    case 'PENDING':
      return 'yellow'
    case 'REVIEWED':
      return 'blue'
    case 'ACTION_TAKEN':
      return 'green'
    case 'DISMISSED':
      return 'default'
    default:
      return 'default'
  }
}

const reasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    SPAM: 'Spam',
    HARASSMENT: 'Harassment',
    SCAM: 'Scam',
    OFF_TOPIC: 'Off-Topic',
    OTHER: 'Other',
  }
  return labels[reason] || reason
}

export default function AdminBackPageReportsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') || 'all'
  const reasonFilter = searchParams.get('reason') || 'all'
  const typeFilter = searchParams.get('type') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [reports, setReports] = useState<BackPageReport[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ open: boolean; report: BackPageReport | null }>({
    open: false,
    report: null,
  })

  // Action modal
  const [actionModal, setActionModal] = useState<{
    open: boolean
    report: BackPageReport | null
    action: 'remove_content' | 'warn_user' | 'ban_user' | null
  }>({ open: false, report: null, action: null })
  const [actionNotes, setActionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (reasonFilter !== 'all') params.set('reason', reasonFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/backpage/reports?${params}`)
      const data = await res.json()
      if (data.success) {
        setReports(data.data)
        setPagination(data.pagination)
        setPendingCount(data.pendingCount)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, reasonFilter, typeFilter, currentPage])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`/admin/backpage/reports?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/backpage/reports?${params}`)
  }

  const openDetail = async (report: BackPageReport) => {
    try {
      const res = await fetch(`/api/admin/backpage/reports/${report.id}`)
      const data = await res.json()
      if (data.success) {
        setDetailModal({ open: true, report: data.data })
      }
    } catch (error) {
      console.error('Failed to fetch report details:', error)
    }
  }

  const handleDismiss = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/backpage/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISMISSED' }),
      })
      if (res.ok) {
        setDetailModal({ open: false, report: null })
        fetchReports()
      }
    } catch (error) {
      console.error('Failed to dismiss report:', error)
    }
  }

  const handleAction = async () => {
    if (!actionModal.report || !actionModal.action) return
    setActionLoading(true)
    try {
      // Determine the endpoint based on report type
      const isPost = !!actionModal.report.post
      const entityId = isPost ? actionModal.report.post?.id : actionModal.report.reply?.id

      if (actionModal.action === 'remove_content') {
        // Remove the post or reply
        const endpoint = isPost
          ? `/api/admin/backpage/${entityId}`
          : `/api/admin/backpage/replies/${entityId}`

        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: actionNotes,
            reportId: actionModal.report.id,
          }),
        })
        if (!res.ok) throw new Error('Failed to remove content')
      } else {
        // Warn or ban user - use the post action endpoint
        const _postId = isPost ? actionModal.report.post?.id : actionModal.report.reply?.post?.slug

        // For replies, we need the post ID, so we'll use a different approach
        const res = await fetch(`/api/admin/backpage/${entityId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionModal.action,
            notes: actionNotes,
            reportId: actionModal.report.id,
          }),
        })
        if (!res.ok) throw new Error('Failed to take action')
      }

      setActionModal({ open: false, report: null, action: null })
      setActionNotes('')
      setDetailModal({ open: false, report: null })
      fetchReports()
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
          <h1 className="font-display text-2xl">BackPage Reports</h1>
          {pendingCount > 0 && (
            <Badge variant="yellow">{pendingCount} pending</Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          {pagination && (
            <span className="text-text-muted text-sm">{pagination.total} total reports</span>
          )}
          <Link href="/admin/backpage">
            <Button size="sm" variant="default">Back to Posts</Button>
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
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Reason:</span>
          <select
            value={reasonFilter}
            onChange={(e) => updateFilter('reason', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{reasonLabel(r)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No reports found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Content</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link
                      href={`/user/${report.reporter.username}`}
                      className="hover:underline"
                    >
                      @{report.reporter.username}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{report.post ? 'Post' : 'Reply'}</Badge>
                      {report.post && (
                        <Link
                          href={`/backpage/${report.post.slug}`}
                          className="hover:underline text-sm truncate max-w-[200px]"
                        >
                          {report.post.title}
                        </Link>
                      )}
                      {report.reply && (
                        <Link
                          href={`/backpage/${report.reply.post.slug}`}
                          className="hover:underline text-sm truncate max-w-[200px]"
                        >
                          Reply in: {report.reply.post.title}
                        </Link>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{reasonLabel(report.reason)}</span>
                  </td>
                  <td>
                    <Badge variant={statusVariant(report.status)}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="text-text-muted text-sm">
                    {formatRelativeTime(new Date(report.createdAt))}
                  </td>
                  <td>
                    <Button size="sm" variant="default" onClick={() => openDetail(report)}>
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
            disabled={!pagination.hasMore}
          >
            Next
          </Button>
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, report: null })}
        title="Report Details"
        size="lg"
      >
        {detailModal.report && (
          <div className="space-y-6">
            {/* Report Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted text-sm">Status</span>
                <div className="mt-1">
                  <Badge variant={statusVariant(detailModal.report.status)}>
                    {detailModal.report.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Type</span>
                <div className="mt-1">
                  <Badge variant="default">{detailModal.report.post ? 'Post' : 'Reply'}</Badge>
                </div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Reason</span>
                <div className="mt-1 font-medium">{reasonLabel(detailModal.report.reason)}</div>
              </div>
              <div>
                <span className="text-text-muted text-sm">Reported</span>
                <div className="mt-1">{formatDate(new Date(detailModal.report.createdAt))}</div>
              </div>
            </div>

            {/* Report Details */}
            {detailModal.report.details && (
              <div>
                <span className="text-text-muted text-sm">Details from Reporter</span>
                <div className="mt-1 p-3 bg-bg-accent border border-border-dark">
                  {detailModal.report.details}
                </div>
              </div>
            )}

            {/* Reporter Info */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Reporter</span>
              <div className="mt-2 flex items-center justify-between">
                <Link
                  href={`/user/${detailModal.report.reporter.username}`}
                  className="font-medium hover:underline"
                >
                  @{detailModal.report.reporter.username}
                </Link>
                {detailModal.report.reporterHistory !== undefined && (
                  <span className="text-sm text-text-muted">
                    {detailModal.report.reporterHistory} total reports filed
                  </span>
                )}
              </div>
            </div>

            {/* Reported Content */}
            <div className="border-t border-border-dark pt-4">
              <span className="text-text-muted text-sm">Reported Content</span>
              {detailModal.report.post && (
                <div className="mt-2 p-3 bg-bg-accent border border-border-dark">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/backpage/${detailModal.report.post.slug}`}
                      className="font-medium hover:underline"
                    >
                      {detailModal.report.post.title}
                    </Link>
                    <Badge variant={detailModal.report.post.status === 'ACTIVE' ? 'green' : 'red'}>
                      {detailModal.report.post.status}
                    </Badge>
                  </div>
                  {detailModal.report.post.body && (
                    <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {detailModal.report.post.body}
                    </div>
                  )}
                  <div className="text-sm text-text-muted mt-2">
                    by @{detailModal.report.post.author.username}
                    {detailModal.report.post.author.isBanned && (
                      <Badge variant="red" className="ml-2">banned</Badge>
                    )}
                  </div>
                </div>
              )}
              {detailModal.report.reply && (
                <div className="mt-2 p-3 bg-bg-accent border border-border-dark">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">
                      Reply in:{' '}
                      <Link
                        href={`/backpage/${detailModal.report.reply.post.slug}`}
                        className="hover:underline"
                      >
                        {detailModal.report.reply.post.title}
                      </Link>
                    </span>
                    <Badge variant={detailModal.report.reply.status === 'ACTIVE' ? 'green' : 'red'}>
                      {detailModal.report.reply.status}
                    </Badge>
                  </div>
                  <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {detailModal.report.reply.body}
                  </div>
                  <div className="text-sm text-text-muted mt-2">
                    by @{detailModal.report.reply.author.username}
                    {detailModal.report.reply.author.isBanned && (
                      <Badge variant="red" className="ml-2">banned</Badge>
                    )}
                  </div>
                </div>
              )}
              {detailModal.report.reportedUserHistory && (
                <div className="mt-2 text-sm text-text-muted">
                  Author has {detailModal.report.reportedUserHistory.reportsAgainst} reports
                  against them, {detailModal.report.reportedUserHistory.warnings} warnings
                </div>
              )}
            </div>

            {/* Resolution (if reviewed) */}
            {detailModal.report.resolution && (
              <div className="border-t border-border-dark pt-4">
                <span className="text-text-muted text-sm">Resolution</span>
                <div className="mt-1 p-3 bg-bg-accent border border-border-dark">
                  {detailModal.report.resolution}
                </div>
              </div>
            )}

            {/* Actions */}
            {detailModal.report.status === 'PENDING' && (
              <div className="border-t border-border-dark pt-4 flex gap-2">
                <Button
                  variant="default"
                  onClick={() => handleDismiss(detailModal.report!.id)}
                >
                  Dismiss
                </Button>
                {((detailModal.report.post && detailModal.report.post.status === 'ACTIVE') ||
                  (detailModal.report.reply && detailModal.report.reply.status === 'ACTIVE')) && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        report: detailModal.report,
                        action: 'remove_content',
                      })
                    }
                  >
                    Remove Content
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      report: detailModal.report,
                      action: 'warn_user',
                    })
                  }
                >
                  Warn Author
                </Button>
                {!((detailModal.report.post?.author.isBanned) ||
                  (detailModal.report.reply?.author.isBanned)) && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        report: detailModal.report,
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
          setActionModal({ open: false, report: null, action: null })
          setActionNotes('')
        }}
        title={
          actionModal.action === 'remove_content'
            ? 'Remove Content'
            : actionModal.action === 'warn_user'
            ? 'Warn Author'
            : 'Ban Author'
        }
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            {actionModal.action === 'remove_content' &&
              'This will remove the reported content from BackPage.'}
            {actionModal.action === 'warn_user' &&
              'This will send a warning to the content author.'}
            {actionModal.action === 'ban_user' &&
              'This will ban the content author from the platform.'}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="input w-full h-24"
              placeholder="Additional notes about this action..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="default"
              onClick={() => {
                setActionModal({ open: false, report: null, action: null })
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
