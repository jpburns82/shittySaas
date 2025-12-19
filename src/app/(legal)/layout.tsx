import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <nav className="mb-8">
          <Link
            href="/"
            className="text-text-muted hover:text-text-primary no-underline"
          >
            &larr; Back to {APP_NAME}
          </Link>
        </nav>

        {/* Content area with prose styling */}
        <article className="prose-legal">{children}</article>
      </div>
    </div>
  )
}
