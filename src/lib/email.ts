import { Resend } from 'resend'
import { escapeHtml } from './utils'
import { generateDownloadUrl } from './download-token'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@undeadlist.com'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'UndeadList'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ----- EMAIL TEMPLATES -----

interface EmailResult {
  success: boolean
  error?: string
}

// Email verification
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<EmailResult> {
  const verifyUrl = `${APP_URL}/verify?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Verify your ${APP_NAME} account`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Welcome to ${APP_NAME}, ${escapeHtml(username)}!
          </h1>
          <p>Click the link below to verify your email address:</p>
          <p style="margin: 20px 0;">
            <a href="${verifyUrl}" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              Verify Email
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">
            Or copy this link: ${verifyUrl}
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            If you didn't create an account, you can ignore this email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Password reset
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Password Reset Request
          </h1>
          <p>Someone requested a password reset for your account. If this was you, click below:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 12px; color: #666;">
            This link expires in 1 hour.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Purchase confirmation (buyer)
export async function sendPurchaseConfirmationEmail(
  email: string,
  listingTitle: string,
  amount: number,
  downloadUrl?: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your purchase: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Purchase Confirmed!
          </h1>
          <p>Thanks for your purchase on ${APP_NAME}!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Item</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Amount</td>
              <td style="border: 1px solid #333; padding: 8px;">$${(amount / 100).toFixed(2)}</td>
            </tr>
          </table>
          ${downloadUrl ? `
            <p>Access your purchase:</p>
            <p style="margin: 20px 0;">
              <a href="${downloadUrl}" style="background: #008000; color: white; border: 2px outset #0a0; padding: 8px 16px; text-decoration: none;">
                Download Files
              </a>
            </p>
          ` : `
            <p>The seller will deliver your purchase within the specified timeframe.</p>
          `}
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            Questions? Contact the seller through the platform.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send purchase confirmation:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Sale notification (seller)
export async function sendSaleNotificationEmail(
  email: string,
  listingTitle: string,
  amount: number,
  buyerUsername?: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You made a sale! ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            $$$ You made a sale! $$$
          </h1>
          <p style="font-size: 18px; color: #008000; font-weight: bold;">
            +$${(amount / 100).toFixed(2)}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Item</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            ${buyerUsername ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Buyer</td>
              <td style="border: 1px solid #333; padding: 8px;">@${escapeHtml(buyerUsername)}</td>
            </tr>
            ` : ''}
          </table>
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/sales" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send sale notification:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Featured listing confirmation
export async function sendFeaturedConfirmationEmail(
  email: string,
  listingTitle: string,
  durationDays: number,
  listingUrl: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your listing is now featured: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Your Listing is Featured!
          </h1>
          <p style="font-size: 16px; color: #008000; font-weight: bold;">
            Your listing will be highlighted for ${durationDays} days
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Listing</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Duration</td>
              <td style="border: 1px solid #333; padding: 8px;">${durationDays} days</td>
            </tr>
          </table>
          <p>Your listing will appear at the top of search results and category pages with a featured badge.</p>
          <p style="margin: 20px 0;">
            <a href="${listingUrl}" style="background: #008000; color: white; border: 2px outset #0a0; padding: 8px 16px; text-decoration: none;">
              View Your Listing
            </a>
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            Thank you for featuring your listing on ${APP_NAME}!
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send featured confirmation:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// New message notification
export async function sendMessageNotificationEmail(
  email: string,
  senderUsername: string,
  attachmentInfo?: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New message from @${senderUsername}${attachmentInfo || ''}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            New Message
          </h1>
          <p>You have a new message from @${escapeHtml(senderUsername)}${attachmentInfo ? escapeHtml(attachmentInfo) : ''}.</p>
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/messages" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View Message
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send message notification:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// ----- DISPUTE EMAIL NOTIFICATIONS -----

// Notify seller when a dispute is opened
export async function sendDisputeOpenedSellerEmail(
  email: string,
  listingTitle: string,
  reason: string,
  buyerUsername: string,
  notes?: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Dispute opened on: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #a00; padding-bottom: 10px; color: #a00;">
            Dispute Opened
          </h1>
          <p>A buyer has opened a dispute on one of your sales.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Listing</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Buyer</td>
              <td style="border: 1px solid #333; padding: 8px;">@${escapeHtml(buyerUsername)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Reason</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(reason.replace(/_/g, ' '))}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Notes</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(notes)}</td>
            </tr>
            ` : ''}
          </table>
          <p>Funds are held in escrow until the dispute is resolved. An admin will review and make a decision.</p>
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/sales" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send dispute opened seller email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Confirm to buyer their dispute was submitted
export async function sendDisputeOpenedBuyerConfirmEmail(
  email: string,
  listingTitle: string,
  notes?: string
): Promise<EmailResult> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Dispute submitted: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Dispute Submitted
          </h1>
          <p>Your dispute has been submitted and is pending review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Listing</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Status</td>
              <td style="border: 1px solid #333; padding: 8px;">Pending Review</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Your Notes</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(notes)}</td>
            </tr>
            ` : ''}
          </table>
          <p>Funds are held in escrow. An admin will review your dispute and notify you of the outcome.</p>
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/purchases" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send dispute opened buyer confirm email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Notify buyer of dispute resolution
export async function sendDisputeResolvedBuyerEmail(
  email: string,
  listingTitle: string,
  resolution: string,
  refundAmountCents?: number,
  notes?: string
): Promise<EmailResult> {
  const resolutionText = resolution === 'REFUND_BUYER'
    ? 'Full refund issued to you'
    : resolution === 'PARTIAL_REFUND'
    ? `Partial refund of $${((refundAmountCents || 0) / 100).toFixed(2)} issued to you`
    : 'Funds released to seller'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Dispute resolved: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Dispute Resolved
          </h1>
          <p>Your dispute has been reviewed and resolved.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Listing</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Outcome</td>
              <td style="border: 1px solid #333; padding: 8px; ${resolution === 'REFUND_BUYER' || resolution === 'PARTIAL_REFUND' ? 'color: #008000; font-weight: bold;' : ''}">${escapeHtml(resolutionText)}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Notes</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(notes)}</td>
            </tr>
            ` : ''}
          </table>
          ${resolution === 'REFUND_BUYER' || resolution === 'PARTIAL_REFUND' ? '<p>Refunds typically appear in 5-10 business days.</p>' : ''}
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/purchases" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send dispute resolved buyer email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Notify seller of dispute resolution
export async function sendDisputeResolvedSellerEmail(
  email: string,
  listingTitle: string,
  resolution: string,
  payoutAmountCents?: number,
  notes?: string
): Promise<EmailResult> {
  const resolutionText = resolution === 'RELEASE_TO_SELLER'
    ? `Funds released to you: $${((payoutAmountCents || 0) / 100).toFixed(2)}`
    : resolution === 'PARTIAL_REFUND'
    ? `Partial payout to you: $${((payoutAmountCents || 0) / 100).toFixed(2)}`
    : 'Full refund issued to buyer'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Dispute resolved: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            Dispute Resolved
          </h1>
          <p>A dispute on your sale has been resolved.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Listing</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(listingTitle)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Outcome</td>
              <td style="border: 1px solid #333; padding: 8px; ${resolution === 'RELEASE_TO_SELLER' || resolution === 'PARTIAL_REFUND' ? 'color: #008000; font-weight: bold;' : 'color: #a00;'}">${escapeHtml(resolutionText)}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Notes</td>
              <td style="border: 1px solid #333; padding: 8px;">${escapeHtml(notes)}</td>
            </tr>
            ` : ''}
          </table>
          ${resolution === 'RELEASE_TO_SELLER' || resolution === 'PARTIAL_REFUND' ? '<p>Payouts typically arrive within 2-7 business days.</p>' : ''}
          <p style="margin: 20px 0;">
            <a href="${APP_URL}/dashboard/sales" style="background: #e0e0e0; border: 2px outset #ccc; padding: 8px 16px; text-decoration: none; color: #000;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send dispute resolved seller email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Guest download email (for guest purchases)
export async function sendGuestDownloadEmail(
  email: string,
  listingTitle: string,
  purchaseId: string
): Promise<EmailResult> {
  try {
    const downloadUrl = generateDownloadUrl(purchaseId, email)

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your download: ${listingTitle}`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e8e8e8;">
          <h1 style="font-size: 24px; color: #22d3ee; border-bottom: 2px solid #22d3ee; padding-bottom: 10px;">
            Your Purchase is Ready!
          </h1>
          <p style="margin-bottom: 16px;">
            Thank you for purchasing <strong style="color: #22d3ee;">${escapeHtml(listingTitle)}</strong>
          </p>
          <p style="margin-bottom: 24px;">
            Click the button below to download your files:
          </p>
          <p style="margin: 20px 0;">
            <a href="${downloadUrl}" style="display: inline-block; background: #22d3ee; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold;">
              Download Now
            </a>
          </p>
          <p style="margin-top: 24px; font-size: 14px; color: #888;">
            This link expires in 7 days. If you have any issues, reply to this email.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #333; padding-top: 10px;">
            ${APP_NAME} - Where dead code gets a second life
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send guest download email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
