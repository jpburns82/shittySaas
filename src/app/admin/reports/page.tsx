'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatRelativeTime } from '@/lib/utils'

type Report = {
  id: string
  entityType: 'LISTING' | 'COMMENT' | 'USER' | 'MESSAGE'
  reason: string
  details: string | null
  status: 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED'
  resolution: string | null
  reviewedAt: string | null
  createdAt: string
  reporter: {
    id: string
    username: string
    avatarUrl: string | null
  }
  listing: {
    id: string
    title: string
    slug: string
    seller: {
      id: string
      username: string
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

const REPORT_REASONS = [
  'SPAM',
  'STOLEN_CODE',
  'MISLEADING',
  'SCAM',
  'MALWARE',
  'HARASSMENT',
  'ILLEGAL',
  'COPYRIGHT',
  'OTHER',
]

const ENTITY_TYPES = ['LISTING', 'COMMENT', 'USER', 'MESSAGE']

const STATUSES = ['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED']

const statusVariant = (status: string) => {
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
    STOLEN_CODE: 'Stolen Code',
    MISLEADING: 'Misleading',
    SCAM: 'Scam',
    MALWARE: 'Malware',
    HARASSMENT: 'Harassment',
    ILLEGAL: 'Illegal Content',
    COPYRIGHT: 'Copyright',
    OTHER: 'Other',
  }
  return labels[reason] || reason
}

export default function AdminReportsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') || 'all'
  const entityTypeFilter = searchParams.get('entityType') || 'all'
  const reasonFilter = searchParams.get('reason') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [reports, setReports] = useState<Report[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Detail modal state
  const [detailModal, setDetailModal] = useState<{ open: boolean; report: Report | null }>({
    open: false,
    report: null,
  })

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean
    report: Report | null
    action: 'remove_content' | 'warn_user' | 'ban_user' | null
  }>({ open: false, report: null, action: null })
  const [actionNotes, setActionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
      if (reasonFilter !== 'all') params.set('reason', reasonFilter)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/reports?${params}`)
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
  }, [statusFilter, entityTypeFilter, reasonFilter, currentPage])

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
    router.push(`/admin/reports?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/reports?${params}`)
  }

  const openDetail = async (report: Report) => {
    // Fetch full report details
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`)
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
      const res = await fetch(`/api/admin/reports/${reportId}`, {
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
      const res = await fetch(`/api/admin/reports/${actionModal.report.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.action,
          notes: actionNotes,
        }),
      })
      if (res.ok) {
        setActionModal({ open: false, report: null, action: null })
        setActionNotes('')
        setDetailModal({ open: false, report: null })
        fetchReports()
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
          <h1 className="font-display text-2xl">Manage Reports</h1>
          {pendingCount > 0 && (
            <Badge variant="yellow">{pendingCount} pending</Badge>
          )}
        </div>
        {pagination && (
          <span className="text-text-muted text-sm">{pagination.total} total reports</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Type:</span>
          <select
            value={entityTypeFilter}
            onChange={(e) => updateFilter('entityType', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Reason Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-text-muted text-sm">Reason:</span>
          <select
            value={reasonFilter}
            onChange={(e) => updateFilter('reason', e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {reasonLabel(r)}
              </option>
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
                <th>Entity</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created</th>
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
                      <Badge variant="default">{report.entityType}</Badge>
                      {report.listing && (
                        <Link
                          href={`/listing/${report.listing.slug}`}
                          className="hover:underline text-sm truncate max-w-[200px]"
                        >
                          {report.listing.title}
                        </Link>
                      )}
                      {report.entityType === 'USER' && report.listing?.seller && (
                        <Link
                          href={`/user/${report.listing.seller.username}`}
                          className="hover:underline text-sm"
                        >
                          @{report.listing.seller.username}
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
                  <Badge variant="default">{detailModal.report.entityType}</Badge>
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

            {/* Details */}
            {detailModal.report.details && (
              <div>
                <span className="text-text-muted text-sm">Details</span>
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

            {/* Reported Entity */}
            {detailModal.report.listing && (
              <div className="border-t border-border-dark pt-4">
                <span className="text-text-muted text-sm">Reported Listing</span>
                <div className="mt-2 p-3 bg-bg-accent border border-border-dark">
                  <Link
                    href={`/listing/${detailModal.report.listing.slug}`}
                    className="font-medium hover:underline"
                  >
                    {detailModal.report.listing.title}
                  </Link>
                  <div className="text-sm text-text-muted mt-1">
                    by @{detailModal.report.listing.seller.username}
                  </div>
                </div>
                {detailModal.report.reportedUserHistory && (
                  <div className="mt-2 text-sm text-text-muted">
                    Seller has {detailModal.report.reportedUserHistory.reportsAgainst} reports
                    against them, {detailModal.report.reportedUserHistory.warnings} warnings
                  </div>
                )}
              </div>
            )}

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
                  Warn User
                </Button>
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
                  Ban User
                </Button>
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
            ? 'Warn User'
            : 'Ban User'
        }
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            {actionModal.action === 'remove_content' &&
              'This will remove the reported content from the platform.'}
            {actionModal.action === 'warn_user' &&
              'This will send a warning to the user responsible for the reported content.'}
            {actionModal.action === 'ban_user' &&
              'This will ban the user responsible for the reported content from the platform.'}
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
