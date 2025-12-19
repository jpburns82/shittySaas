'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

type AuditEntry = {
  id: string
  action: string
  entityType: string
  entityId: string
  actorId: string | null
  actorUsername: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

const ENTITY_TYPES = ['all', 'user', 'listing', 'report', 'purchase', 'message']
const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

export default function AdminAuditLogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const entityTypeFilter = searchParams.get('entityType') || 'all'
  const timeRangeFilter = searchParams.get('timeRange') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
      if (timeRangeFilter !== 'all') params.set('timeRange', timeRangeFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/audit-log?${params}`)
      const data = await res.json()
      if (data.success) {
        setEntries(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch audit log:', error)
    } finally {
      setLoading(false)
    }
  }, [entityTypeFilter, timeRangeFilter, debouncedSearch, currentPage])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset to page 1 when filtering
    router.push(`/admin/audit-log?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/audit-log?${params}`)
  }

  const getActionBadge = (action: string) => {
    if (action.includes('created') || action.includes('added')) {
      return <Badge variant="green">{action}</Badge>
    }
    if (action.includes('deleted') || action.includes('removed') || action.includes('banned')) {
      return <Badge variant="red">{action}</Badge>
    }
    if (action.includes('updated') || action.includes('modified')) {
      return <Badge variant="default">{action}</Badge>
    }
    return <Badge>{action}</Badge>
  }

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Audit Log</h1>
        {pagination && (
          <span className="text-text-muted text-sm">{pagination.total} entries</span>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by entity ID, action, or actor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Entity Type Filter */}
        <div className="flex gap-2">
          <span className="text-text-muted text-sm self-center mr-2">Entity:</span>
          {ENTITY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => updateFilter('entityType', type)}
              className={`px-3 py-1 text-sm border ${
                entityTypeFilter === type
                  ? 'bg-text-primary text-bg-primary border-text-primary'
                  : 'border-border-dark hover:bg-bg-accent'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2">
          <span className="text-text-muted text-sm self-center mr-2">Time:</span>
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => updateFilter('timeRange', range.value)}
              className={`px-3 py-1 text-sm border ${
                timeRangeFilter === range.value
                  ? 'bg-text-primary text-bg-primary border-text-primary'
                  : 'border-border-dark hover:bg-bg-accent'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No audit entries found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <Fragment key={entry.id}>
                  <tr>
                    <td className="text-text-muted whitespace-nowrap">
                      {formatDate(new Date(entry.createdAt))}
                    </td>
                    <td>{getActionBadge(entry.action)}</td>
                    <td>
                      <span className="font-mono text-sm">
                        {entry.entityType}
                      </span>
                      <div className="text-xs text-text-muted font-mono truncate max-w-[150px]">
                        {entry.entityId}
                      </div>
                    </td>
                    <td>
                      {entry.actorUsername ? (
                        <span className="text-accent-ember">@{entry.actorUsername}</span>
                      ) : entry.actorId ? (
                        <span className="text-text-muted font-mono text-xs">
                          {entry.actorId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-text-muted">System</span>
                      )}
                    </td>
                    <td>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => toggleExpand(entry.id)}
                        >
                          {expandedRow === entry.id ? 'Hide' : 'View'}
                        </Button>
                      ) : (
                        <span className="text-text-muted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === entry.id && entry.metadata && (
                    <tr>
                      <td colSpan={5} className="bg-bg-accent">
                        <pre className="text-xs font-mono overflow-x-auto p-2">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
            onClick={() => goToPage(currentPage + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
