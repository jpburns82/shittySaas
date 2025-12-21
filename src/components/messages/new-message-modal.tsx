'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  // Debounced user search
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch {
      console.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setUsers([])
      setSelectedUser(null)
      setMessage('')
      setError('')
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: message.trim(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        onClose()
        router.push(`/dashboard/messages/${selectedUser.id}`)
        router.refresh()
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch {
      setError('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-border-light rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="font-display text-lg">New Message</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!selectedUser ? (
            // Step 1: Select recipient
            <div>
              <label className="block text-sm font-medium mb-2">
                Search for a user
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type username or display name..."
                className="input w-full mb-2"
                autoFocus
              />

              {searching && (
                <p className="text-sm text-text-muted">Searching...</p>
              )}

              {users.length > 0 && (
                <div className="border border-border-dark max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-bg-accent text-left border-b border-border-dark last:border-b-0"
                    >
                      <div className="w-8 h-8 bg-btn-bg border border-border-dark flex items-center justify-center font-display text-sm">
                        {user.displayName?.[0] || user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">@{user.username}</div>
                        {user.displayName && (
                          <div className="text-xs text-text-muted">{user.displayName}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && users.length === 0 && (
                <p className="text-sm text-text-muted">No users found</p>
              )}
            </div>
          ) : (
            // Step 2: Compose message
            <div>
              <div className="flex items-center gap-3 mb-4 p-2 bg-bg-secondary border border-border-dark">
                <div className="w-8 h-8 bg-btn-bg border border-border-dark flex items-center justify-center font-display text-sm">
                  {selectedUser.displayName?.[0] || selectedUser.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">@{selectedUser.username}</div>
                  {selectedUser.displayName && (
                    <div className="text-xs text-text-muted">{selectedUser.displayName}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-text-muted hover:text-text-primary text-sm"
                >
                  Change
                </button>
              </div>

              <label className="block text-sm font-medium mb-2">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="input w-full min-h-[120px] resize-none"
                autoFocus
              />

              {error && (
                <p className="text-sm text-accent-red mt-2">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border-light">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2"
            disabled={loading}
          >
            Cancel
          </button>
          {selectedUser && (
            <button
              onClick={handleSend}
              className="btn-primary px-4 py-2"
              disabled={loading || !message.trim()}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
