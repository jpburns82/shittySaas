import { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `About ${APP_NAME} | ${APP_NAME}`,
  description: 'About UndeadList - the marketplace for abandoned, shelved, and undiscovered software projects.',
}

export default function AboutPage() {
  return (
    <>
      <h1 className="font-display">About UndeadList</h1>
      <p className="text-text-muted mb-8">Built, but undiscovered.</p>

      <p>
        UndeadList is a marketplace for abandoned, shelved, and undiscovered software projects.
        We&apos;re built for the stuff other platforms won&apos;t touch — no MRR requirements,
        no subscriber minimums, no $25k revenue gates.
      </p>

      <p>
        We believe every project deserves a second chance. That script you wrote last year?
        Someone needs it. That SaaS you shelved because life got busy? It could be someone
        else&apos;s solution. That game you built learning to code? A buyer is looking for
        exactly that.
      </p>

      <p>
        UndeadList was created by a developer, for developers. Our fees start at just 2%
        because we&apos;re here to help you win, not take your money.
        See our <Link href="/faq">FAQ</Link> for full fee details.
      </p>

      <div className="flex flex-wrap gap-4 mt-8">
        <Link
          href="/sell"
          className="inline-flex items-center justify-center px-6 py-3 font-display text-lg bg-accent-primary hover:bg-accent-primary/90 text-bg-primary rounded transition-colors"
        >
          Start Selling
        </Link>
        <Link
          href="/listings"
          className="inline-flex items-center justify-center px-6 py-3 font-display text-lg border border-border-default hover:border-text-primary text-text-primary rounded transition-colors"
        >
          Browse Projects
        </Link>
      </div>
    </>
  )
}
