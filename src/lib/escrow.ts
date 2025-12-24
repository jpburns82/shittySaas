import { DeliveryMethod, SellerTier, EscrowStatus } from '@prisma/client'
import { ESCROW_DURATIONS } from './constants'

/**
 * Dynamic Escrow Duration System
 *
 * Escrow time based on risk factors:
 * - Delivery method
 * - Seller tier
 * - Scan status (when available)
 *
 * Risk-based durations:
 * | Scenario                                    | Escrow Time |
 * |---------------------------------------------|-------------|
 * | Instant DL + Clean scan + Verified seller   | Instant     |
 * | Instant DL + Clean scan + New seller        | 24 hours    |
 * | Instant DL + New/unscanned                  | 72 hours    |
 * | Repository Access                           | 72 hours    |
 * | Manual Transfer                             | 7 days      |
 * | Domain Transfer                             | 14 days     |
 */

export type ScanStatus = 'PENDING' | 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'SKIPPED'

export interface EscrowParams {
  deliveryMethod: DeliveryMethod
  sellerTier: SellerTier
  scanStatus?: ScanStatus
}

/**
 * Get escrow duration in hours based on risk factors
 */
export function getEscrowDurationHours(params: EscrowParams): number {
  const { deliveryMethod, sellerTier, scanStatus } = params

  // Instant DL + verified seller + clean scan = instant release
  if (
    deliveryMethod === 'INSTANT_DOWNLOAD' &&
    sellerTier !== 'NEW' &&
    scanStatus === 'CLEAN'
  ) {
    return ESCROW_DURATIONS.INSTANT_RELEASE
  }

  // Instant DL handling
  if (deliveryMethod === 'INSTANT_DOWNLOAD') {
    // New seller or unscanned = 72 hours
    if (sellerTier === 'NEW' || !scanStatus || scanStatus === 'PENDING') {
      return ESCROW_DURATIONS.NEW_SELLER_UNSCANNED
    }
    // Verified/Trusted seller but not clean scan = 24 hours
    return ESCROW_DURATIONS.VERIFIED_SELLER_UNCLEAN
  }

  // Repository access = 72 hours (need time to verify access)
  if (deliveryMethod === 'REPOSITORY_ACCESS') {
    return ESCROW_DURATIONS.REPOSITORY_ACCESS
  }

  // Manual transfer = 7 days (168 hours) - complex handoff
  if (deliveryMethod === 'MANUAL_TRANSFER') {
    return ESCROW_DURATIONS.MANUAL_TRANSFER
  }

  // Domain transfer = 14 days (336 hours) - registrar delays
  if (deliveryMethod === 'DOMAIN_TRANSFER') {
    return ESCROW_DURATIONS.DOMAIN_TRANSFER
  }

  // Default fallback
  return ESCROW_DURATIONS.DEFAULT
}

/**
 * Calculate escrow expiry date
 * Returns null for instant release
 */
export function calculateEscrowExpiry(params: EscrowParams): Date | null {
  const hours = getEscrowDurationHours(params)

  if (hours === 0) {
    return null // Instant release
  }

  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

/**
 * Check if escrow has expired and is ready for release
 */
export function isEscrowExpired(escrowExpiresAt: Date | null): boolean {
  if (!escrowExpiresAt) {
    return true // No expiry = instant release
  }
  return new Date() > escrowExpiresAt
}

/**
 * Check if buyer can still open a dispute
 */
export function canDispute(
  escrowStatus: EscrowStatus,
  escrowExpiresAt: Date | null
): boolean {
  // Can only dispute if funds are still being held
  if (escrowStatus !== 'HOLDING') {
    return false
  }

  // Can't dispute if escrow has expired
  if (!escrowExpiresAt) {
    return false // Instant release - too late
  }

  return new Date() < escrowExpiresAt
}

/**
 * Get remaining escrow time in a human-readable format
 */
export function getEscrowTimeRemaining(escrowExpiresAt: Date | null): string {
  if (!escrowExpiresAt) {
    return 'Released'
  }

  const now = new Date()
  const diff = escrowExpiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return 'Expired'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  if (days > 0) {
    return `${days}d ${remainingHours}h`
  }

  return `${hours}h`
}

/**
 * Check if listing should recommend external escrow (Escrow.com)
 * For high-value or domain transfers
 */
export function shouldRecommendExternalEscrow(
  deliveryMethod: DeliveryMethod,
  priceInCents: number
): boolean {
  // Domain transfers always recommend external escrow
  if (deliveryMethod === 'DOMAIN_TRANSFER') {
    return true
  }

  // High-value transactions ($2000+)
  if (priceInCents >= 200000) {
    return true
  }

  return false
}
