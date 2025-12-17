import { Resend } from 'resend'

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
            Welcome to ${APP_NAME}, ${username}!
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
              <td style="border: 1px solid #333; padding: 8px;">${listingTitle}</td>
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
              <td style="border: 1px solid #333; padding: 8px;">${listingTitle}</td>
            </tr>
            ${buyerUsername ? `
            <tr>
              <td style="border: 1px solid #333; padding: 8px; background: #e0e0e0;">Buyer</td>
              <td style="border: 1px solid #333; padding: 8px;">@${buyerUsername}</td>
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
          <p>You have a new message from @${senderUsername}${attachmentInfo || ''}.</p>
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
