'use client'

import { useVote } from '@/hooks/use-vote'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  listingId: string
  initialCounts: {
    score: number
    upvotes: number
    downvotes: number
  }
  initialUserVote: 1 | -1 | null
  sellerId: string
  className?: string
}

export function VoteButtons({
  listingId,
  initialCounts,
  initialUserVote,
  sellerId,
  className,
}: VoteButtonsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { counts, userVote, isLoading, error, vote } = useVote({
    listingId,
    initialCounts,
    initialUserVote,
  })

  const isOwnListing = session?.user?.id === sellerId

  const handleVote = async (value: 1 | -1) => {
    if (!session) {
      // Redirect to login
      router.push(`/login?callbackUrl=/listing/${listingId}`)
      return
    }

    if (isOwnListing) {
      return // Can't vote on own listing
    }

    await vote(value)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-4">
        {/* Upvote / Reanimate */}
        <button
          onClick={() => handleVote(1)}
          disabled={isLoading || isOwnListing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200',
            'border-border-light bg-bg-secondary',
            'hover:border-accent-electric hover:shadow-[0_0_10px_rgba(0,212,255,0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border-light disabled:hover:shadow-none',
            userVote === 1 && [
              'border-accent-electric bg-accent-electric/10',
              'shadow-[0_0_15px_rgba(0,212,255,0.4)]',
              'text-accent-electric',
            ],
            userVote !== 1 && 'text-text-primary'
          )}
          title={isOwnListing ? 'Cannot vote on your own listing' : 'Reanimate this project'}
          aria-label="Reanimate this project"
        >
          <span className="text-lg">⚡</span>
          <span className="font-mono text-sm">{counts.upvotes}</span>
        </button>

        {/* Downvote / Bury */}
        <button
          onClick={() => handleVote(-1)}
          disabled={isLoading || isOwnListing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200',
            'border-border-light bg-bg-secondary',
            'hover:border-accent-red hover:shadow-[0_0_10px_rgba(255,45,106,0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border-light disabled:hover:shadow-none',
            userVote === -1 && [
              'border-accent-red bg-accent-red/10',
              'shadow-[0_0_15px_rgba(255,45,106,0.4)]',
              'text-accent-red',
            ],
            userVote !== -1 && 'text-text-primary'
          )}
          title={isOwnListing ? 'Cannot vote on your own listing' : 'Bury this project'}
          aria-label="Bury this project"
        >
          <span className="text-lg">⚰️</span>
          <span className="font-mono text-sm">{counts.downvotes}</span>
        </button>

        {/* Score display */}
        <div className="ml-2 text-text-muted text-sm font-mono">
          Score:{' '}
          <span
            className={cn(
              counts.score > 0 && 'text-accent-electric',
              counts.score < 0 && 'text-accent-red',
              counts.score === 0 && 'text-text-muted'
            )}
          >
            {counts.score > 0 ? '+' : ''}
            {counts.score}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <span className="text-sm text-accent-red">{error}</span>
      )}
    </div>
  )
}
