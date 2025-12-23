import { prisma } from '@/lib/prisma'

/**
 * Seller Tier Limits:
 * - NEW (0 sales): 1 active listing
 * - VERIFIED (1+ sales): 3 active listings
 * - TRUSTED (3+ sales): 10 active listings
 * - PRO (10+ sales): Unlimited
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
  if (salesCount >= 10) return 'PRO'
  if (salesCount >= 3) return 'TRUSTED'
  if (salesCount >= 1) return 'VERIFIED'
  return 'NEW'
}

export function getListingLimitForTier(tier: SellerTier): number {
  switch (tier) {
    case 'PRO':
      return Infinity
    case 'TRUSTED':
      return 10
    case 'VERIFIED':
      return 3
    case 'NEW':
    default:
      return 1
  }
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
