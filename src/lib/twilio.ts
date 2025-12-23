/**
 * Twilio SMS Alert Utility
 *
 * Sends SMS alerts to admin for critical events:
 * - Disputes opened
 * - Malware detected
 * - High-value sales (>$500)
 * - New seller first listing
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER

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
 * Send SMS alert to admin
 * Gracefully degrades to console.log if Twilio not configured
 */
export async function alertAdmin(message: string): Promise<boolean> {
  // Always log the alert
  console.log(`[ALERT] ${message}`)

  if (!isTwilioConfigured()) {
    console.log('[Twilio] Not configured, skipping SMS')
    return false
  }

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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Twilio] SMS failed:', response.status, errorText)
      return false
    }

    console.log('[Twilio] SMS sent successfully')
    return true
  } catch (error) {
    console.error('[Twilio] Error sending SMS:', error)
    return false
  }
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
