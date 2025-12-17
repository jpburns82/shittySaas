'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App error:', error)
  }, [error])

  return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-4xl mb-4 text-accent-red">
        Something went wrong!
      </h1>
      <p className="text-text-secondary mb-8">
        An unexpected error occurred. Please try again.
      </p>

      <div className="flex gap-4 justify-center">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="primary" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-text-muted font-mono">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-12 text-text-muted font-mono text-sm">
        <pre>{`
  (╯°□°)╯︵ ┻━┻

  We've logged this error.
        `}</pre>
      </div>
    </div>
  )
}
