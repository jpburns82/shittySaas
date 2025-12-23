'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { GitHubBadge } from '@/components/ui/badges/github-badge'
import { Button } from '@/components/ui/button'

interface GitHubConnectProps {
  isConnected: boolean
  username?: string | null
  connectedAt?: Date | string | null
}

export function GitHubConnect({
  isConnected,
  username,
  connectedAt,
}: GitHubConnectProps) {
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return
    }

    setDisconnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/github/disconnect', { method: 'POST' })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      // Reload to refresh the page state
      window.location.reload()
    } catch {
      setError('Failed to disconnect GitHub. Please try again.')
      setDisconnecting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="card">
        <h3 className="font-display text-lg mb-4">GitHub Connected</h3>

        <div className="flex items-center gap-3 mb-3">
          <GitHubBadge verified username={username} />
          <span className="text-text-muted">@{username}</span>
        </div>

        {connectedAt && (
          <p className="text-sm text-text-muted mb-4">
            Connected {formatDate(new Date(connectedAt))}
          </p>
        )}

        <p className="text-sm text-text-muted mb-4">
          Your GitHub account is linked. Listings with matching repository URLs will show a verified badge.
        </p>

        {error && (
          <p className="text-sm text-accent-red mb-4">{error}</p>
        )}

        <Button
          variant="secondary"
          onClick={handleDisconnect}
          disabled={disconnecting}
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect GitHub'}
        </Button>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-display text-lg mb-4">Connect GitHub</h3>

      <p className="text-text-muted mb-4">
        Link your GitHub account to verify repository ownership. This adds a trusted badge to your listings with matching repos.
      </p>

      <div className="space-y-3 text-sm text-text-muted mb-6">
        <div className="flex items-start gap-2">
          <span className="text-accent-cyan">✓</span>
          <span>Buyers see proof you own the repository</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-accent-cyan">✓</span>
          <span>Builds trust and credibility</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-accent-cyan">✓</span>
          <span>We only access public profile info</span>
        </div>
      </div>

      <a href="/api/auth/github" className="btn btn-primary inline-flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Connect GitHub
      </a>
    </div>
  )
}
