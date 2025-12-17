import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-6xl mb-4">404</h1>
      <p className="text-xl text-text-secondary mb-2">Page not found</p>
      <p className="text-text-muted mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/listings">
          <Button variant="primary">Browse Listings</Button>
        </Link>
      </div>

      <div className="mt-12 text-text-muted font-mono text-sm">
        <pre>{`
  ¯\\_(ツ)_/¯

  Maybe try searching?
        `}</pre>
      </div>
    </div>
  )
}
