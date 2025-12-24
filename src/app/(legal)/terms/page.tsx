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
      <p className="text-text-muted mb-8">Last updated: December 23, 2025</p>

      <h2>1. The Marketplace Platform</h2>
      <p>
        {APP_NAME} is a digital marketplace. We provide the infrastructure for Sellers
        to list software projects and Buyers to discover and purchase them.
      </p>
      <ul>
        <li>
          <strong>No Agency:</strong> {APP_NAME} is not a party to any contract between
          Users. We are not an auctioneer, broker, or financial institution.
        </li>
        <li>
          <strong>&quot;As-Is&quot; Venue:</strong> We do not pre-screen all listings,
          nor do we guarantee the quality, safety, or legality of the projects advertised.
        </li>
      </ul>

      <h2>2. Seller Obligations &amp; Warranties</h2>
      <p>By listing a project, you represent and warrant that:</p>
      <ul>
        <li>
          <strong>Ownership:</strong> You are the legal owner of the code, assets, and
          intellectual property, or have explicit permission to sell them.
        </li>
        <li>
          <strong>Accuracy:</strong> Your listing is a truthful representation of the
          software&apos;s current state.
        </li>
        <li>
          <strong>Delivery:</strong> You will fulfill the transfer of all assets within
          the specified protection period.
        </li>
        <li>
          <strong>Fees:</strong> You agree to the platform commission deducted at the
          point of sale. All platform fees are non-refundable once the transaction is
          initiated.
        </li>
      </ul>
      <p>
        Payment processing services are provided by Stripe and are subject to the{' '}
        <a
          href="https://stripe.com/connect-account/legal"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe Connected Account Agreement
        </a>.
      </p>

      <h2>3. Buyer Responsibilities</h2>
      <p>By purchasing on {APP_NAME}, you acknowledge:</p>
      <ul>
        <li>
          <strong>Due Diligence:</strong> You are responsible for vetting the seller
          and the code. Use the messaging system to ask technical questions before payment.
        </li>
        <li>
          <strong>Risk:</strong> You understand that software is complex and may require
          specific environments to run, which {APP_NAME} does not guarantee.
        </li>
        <li>
          <strong>Verification:</strong> You must verify the assets received before
          the Buyer Protection period expires.
        </li>
      </ul>

      <h2>4. Buyer Protection &amp; Fund Release</h2>
      <p>
        {APP_NAME} provides a conditional payment hold (the &quot;Protection Period&quot;)
        to ensure delivery. Note: This is a marketplace feature, not a licensed escrow
        or banking service.
      </p>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-crypt">
              <th className="text-left py-2 pr-4">Asset Type</th>
              <th className="text-left py-2">Release Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-crypt/50">
              <td className="py-2 pr-4">Instant Download (Verified)</td>
              <td className="py-2">Immediate release</td>
            </tr>
            <tr className="border-b border-border-crypt/50">
              <td className="py-2 pr-4">Instant Download (New/Unscanned)</td>
              <td className="py-2">72-hour hold</td>
            </tr>
            <tr className="border-b border-border-crypt/50">
              <td className="py-2 pr-4">Repository Access (GitHub/GitLab)</td>
              <td className="py-2">72-hour hold</td>
            </tr>
            <tr className="border-b border-border-crypt/50">
              <td className="py-2 pr-4">Manual Transfer</td>
              <td className="py-2">7-day hold</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Domain Transfers</td>
              <td className="py-2">14-day hold</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Automatic Release:</strong> Once the Protection Period expires, funds
        are automatically released to the Seller. After this point, all sales are final
        and {APP_NAME} cannot facilitate a refund.
      </p>

      <h2>5. High-Value Transactions ($2,000+)</h2>
      <p>
        For transactions exceeding $2,000 USD, or those involving complex legal transfers,
        we strongly recommend using a dedicated third-party service like{' '}
        <a href={EXTERNAL_LINKS.ESCROW_SERVICE} target="_blank" rel="noopener noreferrer">
          Escrow.com
        </a>
        . While {APP_NAME} provides basic protection, we are not equipped to mediate
        high-stakes legal or technical disputes.
      </p>

      <h2>6. Dispute Resolution</h2>
      <p>
        If a Buyer receives an item that is &quot;Significantly Not as Described&quot;
        or if the Seller is unresponsive:
      </p>
      <ul>
        <li>
          <strong>Report:</strong> You must file a dispute via the &quot;Purchases&quot;
          page before the protection period ends.
        </li>
        <li>
          <strong>Mediation:</strong> We will freeze the funds and review communications
          between both parties.
        </li>
        <li>
          <strong>Outcome:</strong> We reserve the sole right to determine if a refund
          is warranted or if funds should be released to the seller.
        </li>
      </ul>

      <h2>7. Prohibited Content &amp; Conduct</h2>
      <p>The following are strictly prohibited:</p>
      <ul>
        <li>
          <strong>Malware:</strong> Any code containing viruses, backdoors, or malicious
          scripts.
        </li>
        <li>
          <strong>IP Theft:</strong> Stolen, &quot;nulled,&quot; or cracked software.
        </li>
        <li>
          <strong>Deception:</strong> Projects designed to scam users or harvest data.
        </li>
        <li>
          <strong>Off-Platform Trading:</strong> Attempting to circumvent platform fees
          by taking the transaction outside of {APP_NAME}.
        </li>
      </ul>

      <h2>8. Limitation of Liability</h2>
      <p>
        {APP_NAME} is provided &quot;As-Is.&quot; To the maximum extent permitted by law,
        {APP_NAME} and its owners shall not be liable for:
      </p>
      <ul>
        <li>
          Direct, indirect, or incidental damages resulting from your use of the platform.
        </li>
        <li>Loss of profits, data, or business reputation.</li>
      </ul>
      <p>
        <strong>Liability Cap:</strong> Our total liability to you for any claim is
        limited to the amount of platform fees you have paid us in the 12 months
        preceding the claim.
      </p>

      <h2>9. Account &amp; Termination</h2>
      <ul>
        <li>
          <strong>Eligibility:</strong> You must be 18+ years old to use this service.
        </li>
        <li>
          <strong>Account Security:</strong> You are responsible for maintaining the
          security of your credentials.
        </li>
        <li>
          <strong>Right to Terminate:</strong> We reserve the right to suspend or ban
          accounts that violate these terms or harm the marketplace ecosystem without
          prior notice.
        </li>
      </ul>
      <p>
        We may update these Terms. Continued use of the platform after changes are
        posted constitutes acceptance of the new Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? <Link href="/contact">Contact us</Link>.
      </p>
    </>
  )
}
