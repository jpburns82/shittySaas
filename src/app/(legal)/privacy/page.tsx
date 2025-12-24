import { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: 'Privacy Policy for UndeadList - how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display">Privacy Policy</h1>
      <p className="text-text-muted mb-8">Last updated: December 23, 2025</p>

      <h2>We&apos;re devs too.</h2>
      <p>
        We hate invasive data practices. We collect only what is necessary to run
        the marketplace, prevent fraud, and keep your account secure.
      </p>

      <h2>Data Collection &amp; Use</h2>
      <ul>
        <li>
          <strong>Account Data:</strong> Email (notifications/login), Username (public),
          and Password (salted/hashed via bcrypt).
        </li>
        <li>
          <strong>Listing &amp; Transaction Data:</strong> We store listing content,
          uploaded files, and transaction history. This is required for delivery and
          tax compliance.
        </li>
        <li>
          <strong>Communication:</strong> We store on-platform messages to resolve disputes.
        </li>
        <li>
          <strong>Financial Data:</strong> We use Stripe for payments. {APP_NAME} never
          stores your credit card numbers. Stripe shares a &quot;token&quot; with us and
          the last 4 digits for support purposes.
        </li>
        <li>
          <strong>Technical Data:</strong> IP addresses and browser types are logged for
          security and fraud prevention only (90-day retention).
        </li>
      </ul>

      <h2>What We DON&apos;T Do</h2>
      <ul>
        <li>
          <strong>No Selling Data:</strong> We never sell your info to third parties or
          advertisers.
        </li>
        <li>
          <strong>No AI Training:</strong> Your code and data are never used to train
          LLMs or AI models.
        </li>
        <li>
          <strong>No Tracking:</strong> We don&apos;t use &quot;creepy&quot; cross-site
          tracking pixels.
        </li>
      </ul>

      <h2>Cookie Policy</h2>
      <p>We use &quot;Essential Cookies&quot; only:</p>
      <ol>
        <li>
          <strong>Session:</strong> To keep you logged in.
        </li>
        <li>
          <strong>CSRF:</strong> To prevent cross-site request forgery attacks.
        </li>
      </ol>

      <h2>Data Retention &amp; Deletion</h2>
      <ul>
        <li>
          <strong>Account Deletion:</strong> You can delete your account via{' '}
          <Link href="/dashboard/settings">Settings</Link>. Most data is wiped within
          30 days.
        </li>
        <li>
          <strong>Legal Hold:</strong> Transaction records and tax-related data are
          retained for 7 years as required by law.
        </li>
        <li>
          <strong>Security Logs:</strong> Automatically purged after 90 days.
        </li>
      </ul>

      <h2>Strict 18+ Policy</h2>
      <p>
        {APP_NAME} is strictly for users aged 18 and older. We do not knowingly collect
        data from minors. If we discover an account belongs to a minor, it will be
        terminated immediately and all associated data deleted.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data requests? <Link href="/contact">Contact us</Link>.
      </p>
    </>
  )
}
