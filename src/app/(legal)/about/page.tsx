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
        UndeadList is a flea market for indie software — side projects, MVPs, and hidden gems
        that haven&apos;t found their audience yet. We&apos;re built for the stuff other platforms
        won&apos;t touch — no MRR requirements, no subscriber minimums, no $25k revenue gates.
      </p>

      <p>
        Every project deserves to find its people. That script you wrote last year?
        Someone&apos;s searching for it. That SaaS you put on hold? It could be exactly what
        another dev needs. That game you built learning to code? A buyer is looking for it
        right now.
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
