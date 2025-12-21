import { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME, EXTERNAL_LINKS } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: 'Terms of Service for UndeadList - the marketplace for undiscovered software projects.',
}

export default function TermsPage() {
  return (
    <>
      <h1 className="font-display">Terms of Service</h1>
      <p className="text-text-muted mb-8">Last updated: December 2025</p>

      <h2>What We Are</h2>
      <p>
        {APP_NAME} is a marketplace platform. We connect people who want to sell software projects
        with people who want to buy them. That&apos;s it.
      </p>
      <p>
        <strong>We are NOT:</strong>
      </p>
      <ul>
        <li>A party to any transaction between buyers and sellers</li>
        <li>An escrow service</li>
        <li>A guarantor of project quality, functionality, or value</li>
        <li>A legal representative for either party</li>
      </ul>

      <h2>For Sellers</h2>
      <p>When you list a project on {APP_NAME}, you&apos;re agreeing that:</p>
      <ul>
        <li>You legally own (or have rights to sell) everything you&apos;re listing</li>
        <li>Your listing description is accurate and not misleading</li>
        <li>You will deliver what you promise, in the timeframe you promise</li>
        <li>You won&apos;t list malware, stolen code, or anything illegal</li>
        <li>You&apos;re responsible for any disputes with buyers</li>
      </ul>
      <p>
        Platform fees are deducted from each sale. See our <Link href="/faq">FAQ</Link> for
        current rates. These fees are non-refundable.
      </p>

      <h2>For Buyers</h2>
      <p>When you purchase on {APP_NAME}, you&apos;re agreeing that:</p>
      <ul>
        <li><strong>All sales are final.</strong> Do your homework before buying.</li>
        <li>You&apos;re responsible for your own due diligence</li>
        <li>Message sellers with questions before purchasing</li>
        <li>You understand we can&apos;t guarantee what you&apos;re buying will work as expected</li>
      </ul>

      <h2>High-Value Transactions ($500+)</h2>
      <p>
        For sales over $500, we <strong>strongly recommend</strong> that buyers and sellers
        arrange their own escrow service or legal agreement. {APP_NAME} provides messaging
        and payment processing only — we are not equipped to mediate large transactions.
      </p>
      <p>
        Consider using a service like <a href={EXTERNAL_LINKS.ESCROW_SERVICE} target="_blank" rel="noopener noreferrer">Escrow.com</a> for
        significant purchases.
      </p>

      <h2>Disputes</h2>
      <p>
        If something goes wrong with a transaction:
      </p>
      <ol>
        <li>Contact the other party first and try to resolve it</li>
        <li>If that doesn&apos;t work, you can contact us</li>
        <li>We may try to help mediate, but we&apos;re not obligated to</li>
        <li>We are not responsible for resolving disputes or issuing refunds</li>
      </ol>

      <h2>Account Requirements</h2>
      <ul>
        <li>You must be 18 years or older (or have parental consent)</li>
        <li>One account per person</li>
        <li>Keep your login credentials secure</li>
        <li>You&apos;re responsible for everything that happens under your account</li>
      </ul>

      <h2>Prohibited Content</h2>
      <p>Don&apos;t list or sell:</p>
      <ul>
        <li>Malware, viruses, or malicious code</li>
        <li>Stolen code or intellectual property you don&apos;t own</li>
        <li>Anything illegal in your jurisdiction or ours</li>
        <li>Projects that exist primarily to scam or deceive</li>
        <li>Adult content</li>
      </ul>

      <h2>Our Rights</h2>
      <p>We reserve the right to:</p>
      <ul>
        <li>Remove any listing at our discretion</li>
        <li>Suspend or ban any user at our discretion</li>
        <li>Modify these terms with notice</li>
        <li>Shut down the platform (we&apos;ll give you warning if we do)</li>
      </ul>

      <h2>Limitation of Liability</h2>
      <p>
        {APP_NAME} is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
      </p>
      <ul>
        <li>The quality or functionality of any project sold</li>
        <li>Disputes between buyers and sellers</li>
        <li>Lost profits, data, or opportunities</li>
        <li>Anything else that might go wrong</li>
      </ul>
      <p>
        Use of this platform is at your own risk. The maximum liability we accept
        is the amount of platform fees you&apos;ve paid us in the last 12 months.
      </p>

      <h2>Changes to Terms</h2>
      <p>
        We may update these terms as the platform evolves. If we make significant changes,
        we&apos;ll notify you via email or a notice on the site. Continued use after changes
        means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? <Link href="/contact">Contact us</Link>.
      </p>
    </>
  )
}
