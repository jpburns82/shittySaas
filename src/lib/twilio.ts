/**
 * Twilio SMS Alert Utility
 *
 * Sends SMS alerts to admin for critical events:
 * - Disputes opened
 * - Malware detected
 * - High-value sales (>$500)
 * - New seller first listing
 *
 * Falls back to email via Resend if Twilio is not configured or fails.
 */

import { Resend } from 'resend'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'undead1@gmail.com'
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@undeadlist.com'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_PHONE_NUMBER &&
    ADMIN_PHONE_NUMBER
  )
}

/**
 * Send email fallback alert to admin via Resend
 */
async function sendEmailFallback(message: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, cannot send email fallback')
    return false
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[UndeadList Alert] ${message.slice(0, 50)}...`,
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f0;">
          <h1 style="font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            🚨 Admin Alert
          </h1>
          <p style="font-size: 16px; margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #333;">
            ${message}
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
            This alert was sent via email because SMS delivery failed or is not configured.
          </p>
        </div>
      `,
    })
    console.log('[Email] Alert sent to admin via Resend')
    return true
  } catch (error) {
    console.error('[Email] Failed to send alert email:', error)
    return false
  }
}

/**
 * Send SMS alert to admin
 * Falls back to email via Resend if Twilio fails or is not configured
 */
export async function alertAdmin(message: string): Promise<boolean> {
  // Always log the alert
  console.log(`[ALERT] ${message}`)

  // Try Twilio first if configured
  if (isTwilioConfigured()) {
    try {
      // Use Twilio REST API directly (no SDK dependency needed)
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

      const body = new URLSearchParams({
        To: ADMIN_PHONE_NUMBER!,
        From: TWILIO_PHONE_NUMBER!,
        Body: `[UndeadList] ${message}`,
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (response.ok) {
        console.log('[Twilio] SMS sent successfully')
        return true
      }

      // SMS failed, try email fallback
      const errorText = await response.text()
      console.error('[Twilio] SMS failed:', response.status, errorText)
      console.log('[Twilio] Falling back to email...')
      return await sendEmailFallback(message)
    } catch (error) {
      console.error('[Twilio] Error sending SMS:', error)
      console.log('[Twilio] Falling back to email...')
      return await sendEmailFallback(message)
    }
  }

  // Twilio not configured, use email fallback
  console.log('[Twilio] Not configured, using email fallback')
  return await sendEmailFallback(message)
}

// ============================================
// Alert Functions for Specific Events
// ============================================

/**
 * Alert: Dispute opened
 */
export async function alertDisputeOpened(
  listingTitle: string,
  reason: string,
  buyerUsername: string
): Promise<void> {
  await alertAdmin(`🚨 DISPUTE: "${listingTitle}" - ${reason} (by ${buyerUsername})`)
}

/**
 * Alert: Dispute resolved
 */
export async function alertDisputeResolved(
  listingTitle: string,
  resolution: string
): Promise<void> {
  await alertAdmin(`✅ Dispute resolved: "${listingTitle}" - ${resolution}`)
}

/**
 * Alert: Malware detected
 */
export async function alertMalwareDetected(
  filename: string,
  detections: number,
  totalEngines: number
): Promise<void> {
  await alertAdmin(`⚠️ MALWARE: ${filename} (${detections}/${totalEngines} engines)`)
}

/**
 * Alert: High-value sale (>$500)
 */
export async function alertHighValueSale(
  listingTitle: string,
  amountCents: number
): Promise<void> {
  const amount = (amountCents / 100).toFixed(2)
  await alertAdmin(`💰 HIGH-VALUE SALE: $${amount} - "${listingTitle}"`)
}

/**
 * Alert: New seller's first listing
 */
export async function alertNewSellerListing(
  sellerUsername: string,
  listingTitle: string
): Promise<void> {
  await alertAdmin(`👀 NEW SELLER: ${sellerUsername} listed "${listingTitle}"`)
}

/**
 * Alert: Suspicious file detected (review needed)
 */
export async function alertSuspiciousFile(
  filename: string,
  detections: number,
  totalEngines: number
): Promise<void> {
  await alertAdmin(`🔍 REVIEW: ${filename} suspicious (${detections}/${totalEngines} engines)`)
}
