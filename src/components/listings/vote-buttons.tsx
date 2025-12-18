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
            'border-[#333333] bg-[#1a1a1a]',
            'hover:border-[#39ff14] hover:shadow-[0_0_10px_rgba(57,255,20,0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#333333] disabled:hover:shadow-none',
            userVote === 1 && [
              'border-[#39ff14] bg-[#39ff14]/10',
              'shadow-[0_0_15px_rgba(57,255,20,0.4)]',
              'text-[#39ff14]',
            ],
            userVote !== 1 && 'text-[#e8e8e8]'
          )}
          title={isOwnListing ? 'Cannot vote on your own listing' : 'Reanimate this project'}
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
            'border-[#333333] bg-[#1a1a1a]',
            'hover:border-[#ff2d6a] hover:shadow-[0_0_10px_rgba(255,45,106,0.3)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#333333] disabled:hover:shadow-none',
            userVote === -1 && [
              'border-[#ff2d6a] bg-[#ff2d6a]/10',
              'shadow-[0_0_15px_rgba(255,45,106,0.4)]',
              'text-[#ff2d6a]',
            ],
            userVote !== -1 && 'text-[#e8e8e8]'
          )}
          title={isOwnListing ? 'Cannot vote on your own listing' : 'Bury this project'}
        >
          <span className="text-lg">⚰️</span>
          <span className="font-mono text-sm">{counts.downvotes}</span>
        </button>

        {/* Score display */}
        <div className="ml-2 text-[#888888] text-sm font-mono">
          Score:{' '}
          <span
            className={cn(
              counts.score > 0 && 'text-[#39ff14]',
              counts.score < 0 && 'text-[#ff2d6a]',
              counts.score === 0 && 'text-[#888888]'
            )}
          >
            {counts.score > 0 ? '+' : ''}
            {counts.score}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <span className="text-sm text-[#ff2d6a]">{error}</span>
      )}
    </div>
  )
}
