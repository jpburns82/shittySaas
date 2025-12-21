'use client'

import { useState, useCallback, useRef } from 'react'

interface VoteCounts {
  score: number
  upvotes: number
  downvotes: number
}

interface UseVoteOptions {
  listingId: string
  initialCounts: VoteCounts
  initialUserVote: 1 | -1 | null
}

interface UseVoteReturn {
  counts: VoteCounts
  userVote: 1 | -1 | null
  isLoading: boolean
  error: string | null
  vote: (value: 1 | -1) => Promise<void>
}

export function useVote({
  listingId,
  initialCounts,
  initialUserVote,
}: UseVoteOptions): UseVoteReturn {
  const [counts, setCounts] = useState<VoteCounts>(initialCounts)
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use refs to avoid stale closure issues in the vote callback
  const countsRef = useRef(counts)
  const userVoteRef = useRef(userVote)
  countsRef.current = counts
  userVoteRef.current = userVote

  const vote = useCallback(async (value: 1 | -1) => {
    setIsLoading(true)
    setError(null)

    // Store previous state for rollback using refs (always current)
    const previousCounts = countsRef.current
    const previousUserVote = userVoteRef.current

    // Optimistic update using current ref values
    if (userVoteRef.current === value) {
      // Removing vote (toggle off)
      setUserVote(null)
      setCounts(prev => ({
        score: prev.score - value,
        upvotes: value === 1 ? prev.upvotes - 1 : prev.upvotes,
        downvotes: value === -1 ? prev.downvotes - 1 : prev.downvotes,
      }))
    } else if (userVoteRef.current !== null) {
      // Changing vote (swap)
      setUserVote(value)
      setCounts(prev => ({
        score: prev.score + (value * 2), // Swing of 2
        upvotes: value === 1 ? prev.upvotes + 1 : prev.upvotes - 1,
        downvotes: value === -1 ? prev.downvotes + 1 : prev.downvotes - 1,
      }))
    } else {
      // New vote
      setUserVote(value)
      setCounts(prev => ({
        score: prev.score + value,
        upvotes: value === 1 ? prev.upvotes + 1 : prev.upvotes,
        downvotes: value === -1 ? prev.downvotes + 1 : prev.downvotes,
      }))
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to vote')
      }

      // Update with server response (source of truth)
      setCounts(data.data.counts)
      setUserVote(data.data.userVote)
    } catch (err) {
      // Rollback on error
      setCounts(previousCounts)
      setUserVote(previousUserVote)
      setError(err instanceof Error ? err.message : 'Failed to vote')
    } finally {
      setIsLoading(false)
    }
  }, [listingId])  // Only listingId in deps - refs handle the stale closure issue

  return {
    counts,
    userVote,
    isLoading,
    error,
    vote,
  }
}
