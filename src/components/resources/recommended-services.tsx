import Image from 'next/image'
import { APP_NAME } from '@/lib/constants'

export function RecommendedServices() {
  return (
    <section className="card mt-6 mb-6">
      <h2 className="font-display text-lg mb-1">Recommended Services</h2>
      <p className="text-sm text-text-muted mb-6">
        For larger transactions, we recommend using trusted third-party services.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="https://www.escrow.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-bg-crypt border border-border-crypt rounded hover:border-accent-electric transition-colors group"
        >
          <Image
            src="/images/partners/escrow.svg"
            alt="Escrow.com"
            width={120}
            height={40}
            className="h-10 mb-3"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h3 className="font-display text-sm mb-1">Escrow.com</h3>
          <p className="text-xs text-text-muted mb-2">
            Licensed escrow service for sales $500+. Protects both buyer and seller.
          </p>
          <span className="text-xs text-accent-electric group-hover:underline">
            Visit &rarr;
          </span>
        </a>

        <a
          href="https://acquire.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-bg-crypt border border-border-crypt rounded hover:border-accent-electric transition-colors group"
        >
          <Image
            src="/images/partners/acquire.svg"
            alt="Acquire.com"
            width={120}
            height={40}
            className="h-10 mb-3"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h3 className="font-display text-sm mb-1">Acquire.com</h3>
          <p className="text-xs text-text-muted mb-2">
            For startups with $25k+ revenue. When you outgrow {APP_NAME}.
          </p>
          <span className="text-xs text-accent-electric group-hover:underline">
            Visit &rarr;
          </span>
        </a>

        <a
          href="https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-bg-crypt border border-border-crypt rounded hover:border-accent-electric transition-colors group"
        >
          <Image
            src="/images/partners/github.svg"
            alt="GitHub"
            width={120}
            height={40}
            className="h-10 mb-3"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h3 className="font-display text-sm mb-1">GitHub</h3>
          <p className="text-xs text-text-muted mb-2">
            Transfer repository ownership directly. Preserves stars and history.
          </p>
          <span className="text-xs text-accent-electric group-hover:underline">
            Visit &rarr;
          </span>
        </a>

        <a
          href="https://www.loom.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-bg-crypt border border-border-crypt rounded hover:border-accent-electric transition-colors group"
        >
          <Image
            src="/images/partners/loom.png"
            alt="Loom"
            width={120}
            height={40}
            className="h-10 mb-3 brightness-0 invert"
          />
          <h3 className="font-display text-sm mb-1">Loom</h3>
          <p className="text-xs text-text-muted mb-2">
            Record video walkthroughs of your codebase for buyer handoff.
          </p>
          <span className="text-xs text-accent-electric group-hover:underline">
            Visit &rarr;
          </span>
        </a>
      </div>

      <p className="text-xs text-text-muted mt-4 text-center">
        {APP_NAME} is not affiliated with these services. Use at your own discretion.
      </p>
    </section>
  )
}
