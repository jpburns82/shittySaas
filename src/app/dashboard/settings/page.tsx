'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function DashboardSettingsPage() {
  const { data: session, update } = useSession()

  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
    twitterHandle: '',
    githubHandle: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

      {/* Password section */}
      <section className="card mb-8">
        <h2 className="font-display text-lg mb-4">Change Password</h2>
        <form className="space-y-4">
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
          <Button type="submit">Update Password</Button>
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
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
