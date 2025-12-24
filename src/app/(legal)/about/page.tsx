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
        UndeadList is a flea market for indie software — the place to buy and sell
        independent projects that haven&apos;t yet found their audience.
      </p>

      <p>
        <strong>No MRR requirements. No subscriber minimums. No $25k revenue gates.</strong>
      </p>

      <p>Think Craigslist meets Flippa — but for vibe coders.</p>

      <h2>Who We&apos;re For</h2>
      <ul>
        <li><strong>Vibe coders</strong> using Replit, Lovable, Cursor, and AI builders</li>
        <li><strong>Indie devs</strong> with side projects gathering dust</li>
        <li><strong>Solopreneurs</strong> who built something but moved on</li>
        <li><strong>Buyers</strong> looking for a head start instead of building from scratch</li>
      </ul>

      <h2>What You Can Sell</h2>
      <p>Turn your dusty repos into cash. We support 18 categories:</p>
      <ul>
        <li>SaaS Apps, Mobile Apps, Browser Extensions</li>
        <li>APIs &amp; Backends, Boilerplates &amp; Starters</li>
        <li>Scripts &amp; Automations, AI &amp; ML Projects</li>
        <li>Social Media Accounts, Newsletters, Online Communities</li>
        <li>Crypto &amp; Web3, NFT Projects, DeFi &amp; Trading</li>
        <li>Games, Design Assets, Domains &amp; Landing Pages</li>
      </ul>

      <h2>Our Fees</h2>
      <p>We keep fees low because we&apos;re here to help devs, not take their money:</p>
      <table className="w-full text-left mt-4 mb-4">
        <thead>
          <tr className="border-b border-border-light">
            <th className="py-2">Sale Price</th>
            <th className="py-2">Platform Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-dark">
            <td className="py-2">Under $25</td>
            <td className="py-2">2%</td>
          </tr>
          <tr className="border-b border-border-dark">
            <td className="py-2">$25 - $100</td>
            <td className="py-2">3%</td>
          </tr>
          <tr className="border-b border-border-dark">
            <td className="py-2">$100 - $500</td>
            <td className="py-2">4%</td>
          </tr>
          <tr className="border-b border-border-dark">
            <td className="py-2">$500 - $2,000</td>
            <td className="py-2">5%</td>
          </tr>
          <tr>
            <td className="py-2">$2,000+</td>
            <td className="py-2">6%</td>
          </tr>
        </tbody>
      </table>
      <p className="text-text-muted">Minimum fee: $0.50. Compare to Gumroad&apos;s flat 10%.</p>

      <h2>Trust &amp; Safety</h2>
      <p>Every transaction is protected:</p>
      <ul>
        <li><strong>Seller Verification</strong> — All sellers complete Stripe identity verification</li>
        <li><strong>File Scanning</strong> — Uploads scanned via VirusTotal for malware</li>
        <li><strong>GitHub Verification</strong> — Prove you own linked repositories</li>
        <li><strong>Buyer Protection</strong> — Payments held before release (72 hours to 14 days)</li>
        <li><strong>Seller Tiers</strong> — Track record badges: NEW → VERIFIED → TRUSTED → PRO</li>
      </ul>

      <h2>What We Are</h2>
      <ul>
        <li>A marketplace connecting buyers and sellers</li>
        <li>A platform built by developers, for developers</li>
      </ul>

      <h2>What We&apos;re Not</h2>
      <ul>
        <li>A party to any transaction</li>
        <li>A licensed escrow service</li>
        <li>A guarantor of project quality</li>
        <li>Legal or financial advisors</li>
      </ul>

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
