// ===========================================
// UndeadList — Platform Fee Structure
// "Low fees because we're here to help devs, not take their money."
// ===========================================

/**
 * Platform Fee Tiers:
 * - Under $25: 2%
 * - $25-$100: 3%
 * - $100-$500: 4%
 * - $500-$2,000: 5%
 * - $2,000+: 6%
 *
 * Minimum fee: $0.50
 */

export const MINIMUM_FEE_CENTS = 50 // $0.50 minimum

export const PLATFORM_FEE_TIERS = [
  { label: 'Under $25', maxPriceDollars: 25, percent: 2 },
  { label: '$25-$100', maxPriceDollars: 100, percent: 3 },
  { label: '$100-$500', maxPriceDollars: 500, percent: 4 },
  { label: '$500-$2,000', maxPriceDollars: 2000, percent: 5 },
  { label: '$2,000+', maxPriceDollars: Infinity, percent: 6 },
] as const

/**
 * Get the platform fee percentage for a given price
 * @param priceInCents - The listing price in cents
 * @returns The fee percentage as a decimal (e.g., 0.02 for 2%)
 */
export function calculatePlatformFeePercent(priceInCents: number): number {
  const price = priceInCents / 100

  if (price >= 2000) return 0.06  // 6%
  if (price >= 500) return 0.05   // 5%
  if (price >= 100) return 0.04   // 4%
  if (price >= 25) return 0.03    // 3%
  return 0.02                      // 2%
}

/**
 * Calculate the platform fee for a given price
 * @param priceInCents - The listing price in cents
 * @returns The platform fee in cents (minimum $0.50)
 */
export function calculatePlatformFee(priceInCents: number): number {
  const percent = calculatePlatformFeePercent(priceInCents)
  const fee = Math.round(priceInCents * percent)
  return Math.max(fee, MINIMUM_FEE_CENTS)
}

/**
 * Get the display percentage for a price (for UI display)
 * @param priceInCents - The listing price in cents
 * @returns The fee percentage as a whole number (e.g., 2 for 2%)
 */
export function getFeePercentDisplay(priceInCents: number): number {
  return calculatePlatformFeePercent(priceInCents) * 100
}
