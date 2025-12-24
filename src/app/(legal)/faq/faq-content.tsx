'use client'

import Link from 'next/link'
import { Accordion } from '@/components/ui/accordion'
import { APP_NAME } from '@/lib/constants'

const generalFAQ = [
  {
    question: `What is ${APP_NAME}?`,
    answer: (
      <p>
        {APP_NAME} is a marketplace for software projects, SaaS platforms, and digital
        assets. We connect developers who have built functional tools with buyers looking
        for established codebases to grow or integrate.
      </p>
    ),
  },
  {
    question: 'Who is it for?',
    answer: (
      <p>
        Independent developers, AI builders (Vibe Coders), and indie hackers. Whether
        you are offloading a side project or looking for a &quot;starter kit&quot; for
        your next venture, this is the venue for it.
      </p>
    ),
  },
]

const sellingFAQ = [
  {
    question: 'How do I list my project?',
    answer: (
      <>
        <p>
          Connect your Stripe account via the Dashboard, click &quot;New Listing,&quot;
          and provide your project details. You can choose between Instant Download,
          Repository Access, or Manual Transfer.
        </p>
      </>
    ),
  },
  {
    question: 'What are the platform fees?',
    answer: (
      <>
        <p>We use a sliding scale based on the sale price:</p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-crypt">
                <th className="text-left py-2 pr-4">Sale Price</th>
                <th className="text-left py-2">Platform Fee</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-crypt/50">
                <td className="py-2 pr-4">Under $25</td>
                <td className="py-2">2%</td>
              </tr>
              <tr className="border-b border-border-crypt/50">
                <td className="py-2 pr-4">$25 – $100</td>
                <td className="py-2">3%</td>
              </tr>
              <tr className="border-b border-border-crypt/50">
                <td className="py-2 pr-4">$100 – $500</td>
                <td className="py-2">4%</td>
              </tr>
              <tr className="border-b border-border-crypt/50">
                <td className="py-2 pr-4">$500 – $2,000</td>
                <td className="py-2">5%</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">$2,000+</td>
                <td className="py-2">6%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-text-muted">
          The minimum fee is $0.50 per transaction.
        </p>
      </>
    ),
  },
  {
    question: 'What are Seller Tiers?',
    answer: (
      <>
        <p>Listing limits are based on your reputation to ensure marketplace quality:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>New:</strong> 1 active listing</li>
          <li><strong>Verified (1+ Sale):</strong> 3 active listings</li>
          <li><strong>Trusted (3+ Sales):</strong> 10 active listings</li>
          <li><strong>Pro (10+ Sales):</strong> Unlimited</li>
        </ul>
      </>
    ),
  },
]

const buyingFAQ = [
  {
    question: 'How does Buyer Protection work?',
    answer: (
      <>
        <p>
          When you purchase a project, {APP_NAME} holds the funds in a secure state
          until the verification period expires. This ensures you receive the assets
          as described before the seller is paid.
        </p>
        <p className="mt-3"><strong>Release Windows:</strong></p>
        <ul className="mt-2 space-y-1">
          <li><strong>Instant Download (Verified Seller):</strong> Immediate release</li>
          <li><strong>Instant Download (New Seller) / Repo Access:</strong> 72 hours</li>
          <li><strong>Manual Transfer:</strong> 7 days</li>
          <li><strong>Domain Transfer:</strong> 14 days</li>
        </ul>
      </>
    ),
  },
  {
    question: 'What if the project is not as described?',
    answer: (
      <>
        <p>
          If there is a critical issue (malware, missing files, or misleading description),
          you must click &quot;Report Issue&quot; on the purchase page before the protection
          timer expires. This pauses the fund release and initiates a manual review.
        </p>
        <p className="mt-2 text-text-muted">
          <strong>Note:</strong> We only review messages sent through the {APP_NAME} platform
          during dispute mediation.
        </p>
      </>
    ),
  },
]

const trustFAQ = [
  {
    question: 'How is code scanned for security?',
    answer: (
      <>
        <p>
          All uploaded files are automatically scanned via VirusTotal against 70+
          antivirus engines. Projects that pass are marked with the ✓ Scanned badge.
        </p>
      </>
    ),
  },
  {
    question: 'How does ownership verification work?',
    answer: (
      <>
        <p>
          Sellers can link their GitHub profiles. When a listing corresponds to a
          verified repository owned by the seller, it receives the GitHub ✓ badge.
        </p>
        <p className="mt-2">
          Connect GitHub in <Link href="/dashboard/settings">Dashboard → Settings</Link>.
        </p>
      </>
    ),
  },
]

export function FAQContent() {
  return (
    <>
      <h1 className="font-display">Frequently Asked Questions</h1>
      <p className="text-text-muted mb-8">
        Common questions about buying and selling on {APP_NAME}.
      </p>

      <h2>General</h2>
      <Accordion items={generalFAQ} />

      <h2>Selling</h2>
      <Accordion items={sellingFAQ} />

      <h2>Buying &amp; Protection</h2>
      <Accordion items={buyingFAQ} />

      <h2>Trust &amp; Safety</h2>
      <Accordion items={trustFAQ} />

      <div className="mt-12 card">
        <h3 className="text-lg font-display mb-2">Still have questions?</h3>
        <p className="text-text-muted mb-0">
          <Link href="/contact">Contact us</Link> and we&apos;ll get back to you.
        </p>
      </div>
    </>
  )
}
