'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function DashboardSettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
    twitterHandle: '',
    githubHandle: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Notification settings state
  const [notificationPreference, setNotificationPreference] = useState<'instant' | 'digest' | 'off'>('instant')
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    // Fetch current profile data
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile({
            displayName: data.data.displayName || '',
            bio: data.data.bio || '',
            websiteUrl: data.data.websiteUrl || '',
            twitterHandle: data.data.twitterHandle || '',
            githubHandle: data.data.githubHandle || '',
          })
        }
      })
      .catch(console.error)

    // Fetch current notification settings
    fetch('/api/settings/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotificationPreference(data.data.messageNotifications)
        }
      })
      .catch(console.error)
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        setMessage('Profile updated successfully!')
        update() // Refresh session
      } else {
        setMessage('Failed to update profile.')
      }
    } catch {
      setMessage('An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async (value: 'instant' | 'digest' | 'off') => {
    setNotificationLoading(true)
    setNotificationMessage('')
    setNotificationPreference(value)

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageNotifications: value }),
      })

      if (res.ok) {
        setNotificationMessage('Notification preferences saved!')
      } else {
        setNotificationMessage('Failed to update preferences.')
        // Revert on error
        fetch('/api/settings/notifications')
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setNotificationPreference(data.data.messageNotifications)
            }
          })
      }
    } catch {
      setNotificationMessage('An error occurred.')
    } finally {
      setNotificationLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    setPasswordError('')

    // Client-side validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords don't match")
      setPasswordLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      setPasswordLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      })

      const data = await res.json()

      if (data.success) {
        setPasswordMessage('Password changed successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch {
      setPasswordError('An error occurred')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteLoading(true)
    setDeleteError('')

    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm')
      setDeleteLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
      })

      const data = await res.json()

      if (data.success) {
        // Sign out and redirect to home
        await signOut({ redirect: false })
        router.push('/')
      } else {
        setDeleteError(data.error || 'Failed to delete account')
      }
    } catch {
      setDeleteError('An error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Account Settings</h1>

      {/* Profile section */}
      <section className="card mb-8">
        <h2 className="font-display text-lg mb-4">Profile</h2>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'} mb-4`}>
            {message}
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full bg-bg-primary"
              />
              <p className="text-xs text-text-muted mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={session?.user?.username || ''}
                disabled
                className="w-full bg-bg-primary"
              />
              <p className="text-xs text-text-muted mt-1">Username cannot be changed.</p>
            </div>
          </div>

          <Input
            label="Display Name"
            name="displayName"
            value={profile.displayName}
            onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="John Doe"
            hint="How your name appears publicly (optional)"
          />

          <Textarea
            label="Bio"
            name="bio"
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="A short bio about yourself..."
            maxLength={500}
            charCount
          />

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Website"
              name="websiteUrl"
              type="url"
              value={profile.websiteUrl}
              onChange={(e) => setProfile((p) => ({ ...p, websiteUrl: e.target.value }))}
              placeholder="https://yoursite.com"
            />
            <Input
              label="Twitter"
              name="twitterHandle"
              value={profile.twitterHandle}
              onChange={(e) => setProfile((p) => ({ ...p, twitterHandle: e.target.value }))}
              placeholder="yourhandle"
              hint="Without @"
            />
            <Input
              label="GitHub"
              name="githubHandle"
              value={profile.githubHandle}
              onChange={(e) => setProfile((p) => ({ ...p, githubHandle: e.target.value }))}
              placeholder="yourhandle"
            />
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Save Profile
          </Button>
        </form>
      </section>

      {/* Notification settings section */}
      <section className="card mb-8">
        <h2 className="font-display text-lg mb-4">Message Notifications</h2>
        <p className="text-sm text-text-muted mb-4">
          Choose how you want to be notified when you receive new messages.
        </p>

        {notificationMessage && (
          <div className={`alert ${notificationMessage.includes('saved') ? 'alert-success' : 'alert-error'} mb-4`}>
            {notificationMessage}
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="notifications"
              value="instant"
              checked={notificationPreference === 'instant'}
              onChange={() => handleNotificationUpdate('instant')}
              disabled={notificationLoading}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Instant</span>
              <p className="text-sm text-text-muted">
                Get email notifications immediately when you receive a message.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="notifications"
              value="digest"
              checked={notificationPreference === 'digest'}
              onChange={() => handleNotificationUpdate('digest')}
              disabled={notificationLoading}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Daily digest</span>
              <p className="text-sm text-text-muted">
                Get a daily summary of unread messages (coming soon).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="notifications"
              value="off"
              checked={notificationPreference === 'off'}
              onChange={() => handleNotificationUpdate('off')}
              disabled={notificationLoading}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Off</span>
              <p className="text-sm text-text-muted">
                Don&apos;t send email notifications for messages.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* Password section */}
      <section className="card mb-8">
        <h2 className="font-display text-lg mb-4">Change Password</h2>

        {passwordMessage && (
          <div className="alert alert-success mb-4">{passwordMessage}</div>
        )}
        {passwordError && (
          <div className="alert alert-error mb-4">{passwordError}</div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
            hint="At least 8 characters"
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          />
          <Button type="submit" loading={passwordLoading}>Update Password</Button>
        </form>
      </section>

      {/* Danger zone */}
      <section className="card border-accent-red">
        <h2 className="font-display text-lg mb-4 text-accent-red">Danger Zone</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-text-muted">Sign out of your account on this device.</p>
            </div>
            <Button onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</Button>
          </div>

          <div className="border-t border-border-light pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-accent-red">Delete Account</p>
                <p className="text-sm text-text-muted">
                  Permanently delete your account and all data. This cannot be undone.
                </p>
              </div>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full border-accent-red">
            <h2 className="font-display text-xl mb-4 text-accent-red">Delete Account</h2>

            <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red rounded">
              <p className="text-sm font-medium text-accent-red mb-2">Warning: This action is irreversible!</p>
              <ul className="text-sm text-text-muted space-y-1">
                <li>- Your profile will be permanently deleted</li>
                <li>- All your listings will be removed</li>
                <li>- Your purchase history will be anonymized</li>
                <li>- You will lose access to all purchased items</li>
              </ul>
            </div>

            {deleteError && (
              <div className="alert alert-error mb-4">{deleteError}</div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <Input
                label="Enter your password"
                name="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Type <span className="font-mono text-accent-red">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletePassword('')
                    setDeleteConfirmation('')
                    setDeleteError('')
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  loading={deleteLoading}
                  disabled={deleteConfirmation !== 'DELETE'}
                >
                  Delete My Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
