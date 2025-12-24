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
  {
    question: 'When do I get paid?',
    answer: (
      <>
        <p>
          Payments are held during the buyer protection period, then released automatically:
        </p>
        <ul className="mt-2 space-y-1">
          <li><strong>Instant Downloads (verified + scanned):</strong> Instant</li>
          <li><strong>Instant Downloads (new seller):</strong> 72 hours</li>
          <li><strong>Repository Access:</strong> 72 hours</li>
          <li><strong>Manual Transfer:</strong> 7 days</li>
          <li><strong>Domain Transfer:</strong> 14 days</li>
        </ul>
        <p className="mt-2">
          After release, Stripe deposits to your bank in 2-7 business days.
        </p>
      </>
    ),
  },
  {
    question: 'What are the listing limits?',
    answer: (
      <>
        <p>Limits based on your seller tier:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>NEW (0 sales):</strong> 1 active listing</li>
          <li><strong>VERIFIED (1+ sales):</strong> 3 active listings</li>
          <li><strong>TRUSTED (3+ sales):</strong> 10 active listings</li>
          <li><strong>PRO (10+ sales):</strong> Unlimited</li>
        </ul>
        <p className="mt-2">
          Your tier upgrades automatically when you complete sales.
        </p>
      </>
    ),
  },
  {
    question: 'Why do I need to connect Stripe?',
    answer: (
      <>
        <p>Stripe Connect handles:</p>
        <ul className="mt-2 space-y-1">
          <li>Identity verification (required for marketplace sellers)</li>
          <li>Secure payment processing</li>
          <li>Direct deposits to your bank account</li>
        </ul>
        <p className="mt-2">
          You keep your own Stripe account — we never hold your money long-term.
        </p>
      </>
    ),
  },
  {
    question: 'Which delivery method should I use?',
    answer: (
      <>
        <p>Choose based on what you&apos;re selling:</p>
        <p className="mt-3">
          <strong>Instant Download</strong> — Scripts, templates, boilerplates, design assets, games.
          Files hosted on UndeadList. Buyer downloads immediately.
          Protection: 72 hours (instant if verified + scanned).
        </p>
        <p className="mt-2">
          <strong>Repository Access</strong> — SaaS apps, open source projects, code with git history.
          You add the buyer as a collaborator to your repo.
          Protection: 72 hours.
        </p>
        <p className="mt-2">
          <strong>Manual Transfer</strong> — Social accounts, newsletters, communities, complex handoffs.
          You handle the transfer directly with the buyer via messages.
          Protection: 7 days.
        </p>
        <p className="mt-2">
          <strong>Domain Transfer</strong> — Domains, landing pages, accounts requiring registrar changes.
          Protection: 14 days.
        </p>
        <p className="mt-3 text-text-muted">
          For sales $2,000+, consider using <a href="https://escrow.com" target="_blank" rel="noopener noreferrer">Escrow.com</a> for additional protection.
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
    question: 'How does buyer protection work?',
    answer: (
      <>
        <p>
          When you purchase, payment is held before being released to the seller.
          This gives you time to verify your purchase and report any issues.
        </p>
        <p className="mt-2"><strong>Protection periods by delivery type:</strong></p>
        <ul className="mt-2 space-y-1">
          <li><strong>Instant Downloads (verified seller):</strong> Instant release</li>
          <li><strong>Instant Downloads (new seller):</strong> Up to 72 hours</li>
          <li><strong>Repository Access:</strong> 72 hours</li>
          <li><strong>Manual Transfer:</strong> 7 days</li>
          <li><strong>Domain Transfer:</strong> 14 days</li>
        </ul>
        <p className="mt-2">
          During protection, you can report issues via the &quot;Report Issue&quot; button on your purchase.
        </p>
      </>
    ),
  },
  {
    question: 'What do the seller badges mean?',
    answer: (
      <>
        <p>Badges show a seller&apos;s track record:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>NEW (gray):</strong> 0 completed sales</li>
          <li><strong>VERIFIED (blue):</strong> 1+ sales</li>
          <li><strong>TRUSTED (green):</strong> 3+ sales</li>
          <li><strong>PRO (gold):</strong> 10+ sales</li>
        </ul>
        <p className="mt-2">
          Look for the <strong>GitHub ✓</strong> badge — it means the seller proved they own the linked repository.
        </p>
      </>
    ),
  },
  {
    question: "What if there's a problem?",
    answer: (
      <>
        <p>
          <strong>During buyer protection:</strong> Click &quot;Report Issue&quot; on your purchase.
          Select the reason (empty files, not as described, malware, etc.).
          Our team reviews and may pause the payment release.
        </p>
        <p className="mt-2">
          <strong>After protection expires:</strong> Contact the seller directly.
          Once funds are released, disputes are much harder to resolve.
        </p>
        <p className="mt-2">
          <strong>For purchases over $2,000:</strong> We recommend using a third-party
          escrow service like <a href="https://escrow.com" target="_blank" rel="noopener noreferrer">Escrow.com</a> for peace of mind.
        </p>
      </>
    ),
  },
  {
    question: "Why can't I buy more today?",
    answer: (
      <>
        <p>New accounts have daily spend limits for fraud prevention:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>New buyers:</strong> $250/day</li>
          <li><strong>After 1 purchase:</strong> $500/day</li>
          <li><strong>After 3 purchases:</strong> $1,000/day</li>
        </ul>
        <p className="mt-2">
          Limits reset at midnight UTC and increase automatically as you complete purchases.
        </p>
      </>
    ),
  },
]

const trustFAQ = [
  {
    question: 'How are files scanned for malware?',
    answer: (
      <>
        <p>
          Every uploaded file is scanned via VirusTotal (70+ antivirus engines).
          Files flagged as malicious are rejected.
        </p>
        <p className="mt-2">Look for the scan badge:</p>
        <ul className="mt-2 space-y-1">
          <li><strong>✓ Scanned:</strong> Passed security check</li>
          <li><strong>⏳ Pending:</strong> Scan in progress</li>
          <li><strong>⚠️ Review:</strong> Flagged for manual review</li>
        </ul>
      </>
    ),
  },
  {
    question: 'How does GitHub verification work?',
    answer: (
      <>
        <p>
          Sellers can connect their GitHub account to prove repo ownership.
          When a listing links to a repo the seller owns, it shows the <strong>GitHub ✓</strong> badge.
        </p>
        <p className="mt-2">
          Connect GitHub in <Link href="/dashboard/settings">Dashboard → Settings</Link>.
        </p>
      </>
    ),
  },
  {
    question: 'What happens if there\'s a dispute?',
    answer: (
      <>
        <p>During the buyer protection period:</p>
        <ol className="mt-2 space-y-1">
          <li>1. Click &quot;Report Issue&quot; on your purchase</li>
          <li>2. Select the reason (empty files, not as described, malware, etc.)</li>
          <li>3. Our team reviews and may pause the payment release</li>
          <li>4. We work with both parties to resolve</li>
        </ol>
        <p className="mt-2">
          After protection expires, funds are released and disputes are harder to resolve.
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

      <h2>Trust &amp; Safety</h2>
      <Accordion items={trustFAQ} />

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
