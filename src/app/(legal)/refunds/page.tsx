import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Refund Policy | ${APP_NAME}`,
  description: 'Refund Policy for UndeadList - our refund eligibility and process.',
}

export default function RefundsPage() {
  return (
    <>
      <h1 className="font-display">Refund Policy</h1>
      <p className="text-text-muted mb-8">Last updated: December 23, 2025</p>

      <h2>General Policy</h2>
      <p>
        Due to the digital nature of software projects, all sales are final once the
        Buyer Protection period expires or the assets have been fully transferred/downloaded.
      </p>

      <h2>Eligibility for Refunds</h2>
      <p>A refund may be issued only during the Protection Period if:</p>
      <ul>
        <li>
          <strong>Non-Delivery:</strong> The seller fails to provide files or access
          within the specified timeframe.
        </li>
        <li>
          <strong>Inoperable Code:</strong> The software contains critical errors that
          prevent it from running as described and the seller cannot provide a fix.
        </li>
        <li>
          <strong>Misrepresentation:</strong> The project is significantly different
          from the listing (e.g., wrong framework, missing core features).
        </li>
        <li>
          <strong>Security Risks:</strong> The code contains malware, backdoors, or
          unauthorized tracking.
        </li>
      </ul>

      <h2>Non-Refundable Scenarios</h2>
      <p>We cannot issue refunds for:</p>
      <ul>
        <li>
          <strong>Buyer&apos;s Remorse:</strong> &quot;I changed my mind&quot; or
          &quot;I don&apos;t like the code style.&quot;
        </li>
        <li>
          <strong>Lack of Technical Skill:</strong> You do not have the expertise to
          set up or modify the software.
        </li>
        <li>
          <strong>Environment Issues:</strong> The software works as described, but
          your specific server/hosting doesn&apos;t support it.
        </li>
        <li>
          <strong>Expired Protection:</strong> You failed to report an issue before
          the funds were automatically released to the seller.
        </li>
      </ul>

      <h2>How to Request a Refund</h2>
      <p>
        During the Buyer Protection period, click &quot;Report Issue&quot; on your
        purchase page. Select the appropriate reason and provide details. Our team
        will review and respond within 48 hours.
      </p>
    </>
  )
}
