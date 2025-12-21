import Link from 'next/link'
import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'
import { RecommendedServices } from '@/components/resources/recommended-services'

export const metadata: Metadata = {
  title: `Resources & Templates | ${APP_NAME}`,
  description: 'Templates and guides for buying and selling projects successfully on UndeadList.',
}

export default function ResourcesPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">Resources & Templates</h1>
        <p className="text-text-muted mb-8">
          Everything you need to buy and sell successfully on {APP_NAME}.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Seller Card */}
          <Link
            href="/resources/sellers"
            className="p-6 rounded-lg border border-border-light hover:border-accent-pink transition-colors group"
          >
            <h2 className="text-xl font-bold text-accent-pink mb-2">For Sellers</h2>
            <p className="text-text-muted mb-4">
              Templates for listing your project, pricing guides, and handoff checklists.
            </p>
            <span className="text-accent-pink group-hover:underline">
              Browse seller resources &rarr;
            </span>
          </Link>

          {/* Buyer Card */}
          <Link
            href="/resources/buyers"
            className="p-6 rounded-lg border border-border-light hover:border-accent-cyan transition-colors group"
          >
            <h2 className="text-xl font-bold text-accent-cyan mb-2">For Buyers</h2>
            <p className="text-text-muted mb-4">
              Due diligence checklists, questions to ask, and post-purchase guides.
            </p>
            <span className="text-accent-cyan group-hover:underline">
              Browse buyer resources &rarr;
            </span>
          </Link>
        </div>

        <RecommendedServices />
      </div>
    </div>
  )
}
