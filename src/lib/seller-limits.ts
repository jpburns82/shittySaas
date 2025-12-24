import { prisma } from '@/lib/prisma'
import { SELLER_TIER_CONFIG } from '@/lib/constants'

/**
 * Seller Tier Limits:
 * Thresholds defined in constants.ts SELLER_TIER_CONFIG
 */

export type SellerTier = 'NEW' | 'VERIFIED' | 'TRUSTED' | 'PRO'

export async function getSellerSalesCount(userId: string): Promise<number> {
  return prisma.purchase.count({
    where: {
      listing: { sellerId: userId },
      status: 'COMPLETED',
    },
  })
}

export function getSellerTier(salesCount: number): SellerTier {
  if (salesCount >= SELLER_TIER_CONFIG.PRO.minSales) return 'PRO'
  if (salesCount >= SELLER_TIER_CONFIG.TRUSTED.minSales) return 'TRUSTED'
  if (salesCount >= SELLER_TIER_CONFIG.VERIFIED.minSales) return 'VERIFIED'
  return 'NEW'
}

export function getListingLimitForTier(tier: SellerTier): number {
  return SELLER_TIER_CONFIG[tier].listingLimit
}

export async function getSellerListingLimit(userId: string): Promise<number> {
  const salesCount = await getSellerSalesCount(userId)
  const tier = getSellerTier(salesCount)
  return getListingLimitForTier(tier)
}

export async function getActiveListingCount(userId: string): Promise<number> {
  return prisma.listing.count({
    where: {
      sellerId: userId,
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
}

export async function canCreateListing(userId: string): Promise<{
  allowed: boolean
  currentCount: number
  limit: number
  tier: SellerTier
  salesCount: number
}> {
  const [salesCount, activeCount] = await Promise.all([
    getSellerSalesCount(userId),
    getActiveListingCount(userId),
  ])

  const tier = getSellerTier(salesCount)
  const limit = getListingLimitForTier(tier)

  return {
    allowed: activeCount < limit,
    currentCount: activeCount,
    limit,
    tier,
    salesCount,
  }
}
