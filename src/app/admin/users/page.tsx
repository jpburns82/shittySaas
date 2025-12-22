'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { formatDate } from '@/lib/utils'

type User = {
  id: string
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
  isBanned: boolean
  bannedAt: string | null
  banReason: string | null
  deletedAt: string | null
  stripeOnboarded: boolean
  createdAt: string
  _count: {
    listings: number
    sales: number
  }
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

const WARNING_REASONS = [
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'OTHER', label: 'Other' },
]

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const statusFilter = searchParams.get('status') || 'all'
  const roleFilter = searchParams.get('role') || 'all'
  const currentPage = parseInt(searchParams.get('page') || '1')

  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modal states
  const [warnModal, setWarnModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [banModal, setBanModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [unbanModal, setUnbanModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [adminModal, setAdminModal] = useState<{ open: boolean; user: User | null; makeAdmin: boolean }>({
    open: false,
    user: null,
    makeAdmin: false,
  })

  // Form states
  const [warnReason, setWarnReason] = useState('POLICY_VIOLATION')
  const [warnNotes, setWarnNotes] = useState('')
  const [banReason, setBanReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', currentPage.toString())

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, roleFilter, debouncedSearch, currentPage])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset to page 1 when filtering
    router.push(`/admin/users?${params}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/admin/users?${params}`)
  }

  // Action handlers
  const handleWarn = async () => {
    if (!warnModal.user) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${warnModal.user.id}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warnReason, notes: warnNotes }),
      })
      if (res.ok) {
        setWarnModal({ open: false, user: null })
        setWarnReason('POLICY_VIOLATION')
        setWarnNotes('')
      }
    } catch (error) {
      console.error('Failed to warn user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBan = async () => {
    if (!banModal.user) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${banModal.user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      })
      if (res.ok) {
        setBanModal({ open: false, user: null })
        setBanReason('')
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnban = async () => {
    if (!unbanModal.user) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${unbanModal.user.id}/unban`, {
        method: 'POST',
      })
      if (res.ok) {
        setUnbanModal({ open: false, user: null })
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to unban user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleAdmin = async () => {
    if (!adminModal.user) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${adminModal.user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: adminModal.makeAdmin }),
      })
      if (res.ok) {
        setAdminModal({ open: false, user: null, makeAdmin: false })
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update admin status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Manage Users</h1>
        {pagination && (
          <span className="text-text-muted text-sm">{pagination.total} total users</span>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2">
          <span className="text-text-muted text-sm self-center mr-2">Status:</span>
          {['all', 'active', 'banned', 'deleted'].map((status) => (
            <button
              key={status}
              onClick={() => updateFilter('status', status)}
              className={`px-3 py-1 text-sm border ${
                statusFilter === status
                  ? 'bg-accent-electric/20 text-accent-electric border-accent-electric'
                  : 'border-border-dark hover:bg-bg-accent'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Role Filter */}
        <div className="flex gap-2">
          <span className="text-text-muted text-sm self-center mr-2">Role:</span>
          {['all', 'admin', 'seller', 'buyer'].map((role) => (
            <button
              key={role}
              onClick={() => updateFilter('role', role)}
              className={`px-3 py-1 text-sm border ${
                roleFilter === role
                  ? 'bg-accent-electric/20 text-accent-electric border-accent-electric'
                  : 'border-border-dark hover:bg-bg-accent'
              }`}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">Loading...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Listings</th>
                <th>Sales</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-bg-accent flex items-center justify-center text-text-muted">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/user/${user.username}`} className="font-medium hover:underline">
                          @{user.username}
                        </Link>
                        {user.displayName && (
                          <div className="text-xs text-text-muted">{user.displayName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-text-muted">{user.email}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {user.isAdmin && <Badge variant="red">Admin</Badge>}
                      {user.stripeOnboarded && <Badge variant="blue">Seller</Badge>}
                      {user.isBanned && <Badge variant="red">Banned</Badge>}
                      {user.deletedAt && <Badge variant="default">Deleted</Badge>}
                    </div>
                  </td>
                  <td className="text-text-muted">{formatDate(new Date(user.createdAt))}</td>
                  <td className="font-mono">{user._count.listings}</td>
                  <td className="font-mono">{user._count.sales}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setWarnModal({ open: true, user })}
                        disabled={user.deletedAt !== null}
                      >
                        Warn
                      </Button>
                      {user.isBanned ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setUnbanModal({ open: true, user })}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setBanModal({ open: true, user })}
                          disabled={user.isAdmin || user.deletedAt !== null}
                        >
                          Ban
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() =>
                          setAdminModal({ open: true, user, makeAdmin: !user.isAdmin })
                        }
                        disabled={user.deletedAt !== null}
                      >
                        {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
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

      {/* Warn Modal */}
      <Modal
        isOpen={warnModal.open}
        onClose={() => setWarnModal({ open: false, user: null })}
        title={`Warn @${warnModal.user?.username}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="input w-full"
            >
              {WARNING_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={warnNotes}
              onChange={(e) => setWarnNotes(e.target.value)}
              className="input w-full h-24"
              placeholder="Additional details about the warning..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setWarnModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleWarn} disabled={actionLoading}>
              {actionLoading ? 'Sending...' : 'Send Warning'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, user: null })}
        title={`Ban @${banModal.user?.username}`}
      >
        <div className="space-y-4">
          <p className="text-text-muted">
            This will prevent the user from logging in and hide their listings.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Ban Reason *</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="input w-full h-24"
              placeholder="Explain why this user is being banned..."
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setBanModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleBan}
              disabled={actionLoading || !banReason.trim()}
            >
              {actionLoading ? 'Banning...' : 'Ban User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unban Confirmation */}
      <ConfirmModal
        isOpen={unbanModal.open}
        onClose={() => setUnbanModal({ open: false, user: null })}
        onConfirm={handleUnban}
        title="Unban User"
        message={`Are you sure you want to unban @${unbanModal.user?.username}? They will be able to log in and their listings will be visible again.`}
        confirmText={actionLoading ? 'Unbanning...' : 'Unban'}
        loading={actionLoading}
      />

      {/* Admin Toggle Confirmation */}
      <ConfirmModal
        isOpen={adminModal.open}
        onClose={() => setAdminModal({ open: false, user: null, makeAdmin: false })}
        onConfirm={handleToggleAdmin}
        title={adminModal.makeAdmin ? 'Grant Admin Access' : 'Remove Admin Access'}
        message={
          adminModal.makeAdmin
            ? `Are you sure you want to make @${adminModal.user?.username} an admin? They will have full access to the admin panel.`
            : `Are you sure you want to remove admin access from @${adminModal.user?.username}?`
        }
        confirmText={actionLoading ? 'Updating...' : 'Confirm'}
        variant={adminModal.makeAdmin ? 'default' : 'danger'}
        loading={actionLoading}
      />
    </div>
  )
}
