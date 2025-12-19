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
      <p className="text-text-muted mb-8">Last updated: December 2024</p>

      <p>
        We&apos;re devs too. We hate invasive data practices as much as you do. Here&apos;s
        exactly what we collect and why.
      </p>

      <h2>Data We Collect</h2>

      <h3>Account Information</h3>
      <p>When you sign up, we collect:</p>
      <ul>
        <li><strong>Email address</strong> — for login, notifications, and password resets</li>
        <li><strong>Username</strong> — for your public profile</li>
        <li><strong>Password</strong> — stored encrypted (bcrypt), we can&apos;t see it</li>
      </ul>

      <h3>Profile Information (Optional)</h3>
      <p>You can add:</p>
      <ul>
        <li>Display name</li>
        <li>Bio</li>
        <li>Website and social links</li>
        <li>Profile photo</li>
      </ul>

      <h3>Listing Data</h3>
      <p>When you create listings:</p>
      <ul>
        <li>Listing content (title, description, screenshots)</li>
        <li>Pricing information</li>
        <li>Uploaded files for delivery</li>
      </ul>

      <h3>Messages</h3>
      <p>
        We store messages between buyers and sellers to facilitate transactions
        and help with dispute resolution if needed.
      </p>

      <h3>Usage Data</h3>
      <p>Basic analytics to improve the platform:</p>
      <ul>
        <li>Pages visited</li>
        <li>Time on site</li>
        <li>Browser and device type</li>
        <li>IP address (for security/fraud prevention)</li>
      </ul>

      <h2>Payment Data</h2>
      <p>
        <strong>We never see or store your card numbers.</strong> All payment processing
        is handled by Stripe. When you make a purchase, your payment info goes directly
        to Stripe&apos;s secure servers.
      </p>
      <p>
        What we do store: transaction records (amounts, dates, status) for your purchase
        history and seller payouts.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies for authentication and sessions only. No tracking cookies,
        no ad networks, no creepy stuff.
      </p>
      <ul>
        <li><strong>Session cookie</strong> — keeps you logged in</li>
        <li><strong>CSRF token</strong> — security measure</li>
      </ul>

      <h2>What We DON&apos;T Do</h2>
      <ul>
        <li>We don&apos;t sell your data to anyone</li>
        <li>We don&apos;t share your data with advertisers</li>
        <li>We don&apos;t use your data for AI training</li>
        <li>We don&apos;t track you across other websites</li>
      </ul>

      <h2>When We Share Data</h2>
      <p>We only share your data in these cases:</p>
      <ul>
        <li>
          <strong>With Stripe</strong> — for payment processing (required to take payments)
        </li>
        <li>
          <strong>With email providers</strong> — to send you transactional emails
          (purchase confirmations, password resets)
        </li>
        <li>
          <strong>If legally required</strong> — court orders, subpoenas, etc.
        </li>
      </ul>

      <h2>Data Retention</h2>
      <ul>
        <li>
          <strong>Account data</strong> — kept until you delete your account
        </li>
        <li>
          <strong>Transaction records</strong> — kept for 7 years (required for
          tax/legal purposes)
        </li>
        <li>
          <strong>Messages</strong> — kept until you delete your account
        </li>
        <li>
          <strong>Logs</strong> — automatically deleted after 90 days
        </li>
      </ul>

      <h2>Deleting Your Data</h2>
      <p>
        You can delete your account at any time from{' '}
        <Link href="/dashboard/settings">Dashboard → Settings</Link>.
      </p>
      <p>When you delete your account:</p>
      <ul>
        <li>Your profile and listings are removed immediately</li>
        <li>Your data is fully deleted within 30 days</li>
        <li>
          Transaction records are anonymized but retained (legal requirement)
        </li>
      </ul>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your data (check your profile and dashboard)</li>
        <li>Correct inaccurate data</li>
        <li>Delete your account</li>
        <li>Export your data (contact us)</li>
        <li>Opt out of marketing emails (one-click unsubscribe)</li>
      </ul>

      <h2>Security</h2>
      <p>We protect your data with:</p>
      <ul>
        <li>HTTPS encryption on all connections</li>
        <li>Encrypted password storage (bcrypt)</li>
        <li>Secure session handling</li>
        <li>Regular security reviews</li>
      </ul>

      <h2>Children</h2>
      <p>
        {APP_NAME} is not intended for users under 18. We don&apos;t knowingly collect
        data from minors.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        If we make significant changes to this policy, we&apos;ll notify you via email
        or a notice on the site.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data requests? <Link href="/contact">Contact us</Link>.
      </p>
    </>
  )
}
