'use client'

import Link from 'next/link'
import { Accordion } from '@/components/ui/accordion'
import { APP_NAME } from '@/lib/constants'

const generalFAQ = [
  {
    question: 'What is UndeadList?',
    answer: (
      <p>
        A flea market for indie software — side projects, dusty repos, and hidden gems
        that deserve a second life. No MRR requirements, no subscriber minimums.
        You built it? Sell it.
      </p>
    ),
  },
  {
    question: 'Who is UndeadList for?',
    answer: (
      <>
        <p>
          Solo devs with dusty repos. Vibe coders who built something cool with Replit
          or Lovable but don&apos;t know how to monetize it. Indie hackers who moved on.
          Anyone with a project collecting dust that could be someone else&apos;s solution.
        </p>
        <p className="mt-2">
          <strong>Target users:</strong> AI builders (Claude users), vibe coders,
          indie hackers, devs with shelved side projects.
        </p>
      </>
    ),
  },
]

const sellingFAQ = [
  {
    question: 'How do I sell a project?',
    answer: (
      <>
        <p>It&apos;s simple:</p>
        <ol className="mt-2 space-y-1">
          <li>1. Create an account</li>
          <li>2. Connect your Stripe account (for payouts)</li>
          <li>3. List your project with a description and screenshots</li>
          <li>4. Set your price</li>
          <li>5. When someone buys, you get paid directly to Stripe minus our fee</li>
        </ol>
      </>
    ),
  },
  {
    question: 'What can I sell?',
    answer: (
      <>
        <p>If you built it and own it, you can sell it:</p>
        <ul className="mt-2 space-y-1">
          <li>SaaS apps</li>
          <li>Scripts and utilities</li>
          <li>Boilerplates and starter kits</li>
          <li>Templates (code, design, etc.)</li>
          <li>Browser extensions</li>
          <li>Mobile apps</li>
          <li>APIs and microservices</li>
          <li>Domains with attached projects</li>
          <li>AI tools and integrations</li>
          <li>Games and game assets</li>
        </ul>
      </>
    ),
  },
  {
    question: 'What are the fees?',
    answer: (
      <>
        <p>
          We keep fees low because we&apos;re here to help devs, not take their money:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong>Under $25:</strong> 2%
          </li>
          <li>
            <strong>$25 – $100:</strong> 3%
          </li>
          <li>
            <strong>$100 – $500:</strong> 4%
          </li>
          <li>
            <strong>$500 – $2,000:</strong> 5%
          </li>
          <li>
            <strong>$2,000+:</strong> 6%
          </li>
        </ul>
        <p className="mt-3 text-text-muted">
          Minimum fee: $0.50 per transaction.
        </p>
        <p className="mt-2 text-text-muted">
          Compare that to Gumroad&apos;s flat 10%.
        </p>
      </>
    ),
  },
]

const buyingFAQ = [
  {
    question: 'How do I buy a project?',
    answer: (
      <>
        <p>
          Find something you want, click Buy, pay with card. For digital downloads,
          you get instant access. For full project transfers, coordinate with the
          seller via messages.
        </p>
      </>
    ),
  },
  {
    question: 'Are sales final?',
    answer: (
      <>
        <p>
          <strong>Yes.</strong> Do your due diligence before buying. Message the
          seller with questions. We&apos;re a marketplace, not an escrow service.
        </p>
      </>
    ),
  },
  {
    question: "What if there's a problem?",
    answer: (
      <>
        <p>Contact the seller first. Most issues can be resolved directly.</p>
        <p className="mt-2">
          If you can&apos;t resolve it, contact us and we&apos;ll try to help mediate —
          but we&apos;re not obligated to issue refunds.
        </p>
        <p className="mt-2">
          <strong>For purchases over $500:</strong> We recommend using a third-party
          escrow service for peace of mind.
        </p>
      </>
    ),
  },
]

const accountFAQ = [
  {
    question: 'How do I delete my account?',
    answer: (
      <>
        <p>
          Go to <Link href="/dashboard/settings">Dashboard → Settings</Link> and
          click &quot;Delete Account&quot; at the bottom.
        </p>
        <p className="mt-2">
          Your data will be removed within 30 days. Transaction records are
          anonymized but retained for legal/tax purposes.
        </p>
      </>
    ),
  },
  {
    question: 'How do I get paid?',
    answer: (
      <>
        <p>
          We use Stripe Connect. When you sell something, the money goes directly
          to your Stripe account, minus our platform fee.
        </p>
        <p className="mt-2">
          Payouts follow Stripe&apos;s schedule — typically 2-7 business days depending
          on your country and account status.
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

      <h2>Buying</h2>
      <Accordion items={buyingFAQ} />

      <h2>Account</h2>
      <Accordion items={accountFAQ} />

      <div className="mt-12 card">
        <h3 className="text-lg font-display mb-2">Still have questions?</h3>
        <p className="text-text-muted mb-0">
          <Link href="/contact">Contact us</Link> and we&apos;ll get back to you.
        </p>
      </div>
    </>
  )
}
