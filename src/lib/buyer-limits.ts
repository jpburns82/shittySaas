/**
 * Buyer Spend Limits
 *
 * Limits daily spending based on buyer tier to prevent fraud
 * and protect new users.
 */

import { prisma } from './prisma'
import type { BuyerTier } from '@prisma/client'

/**
 * Get daily spend limit in cents based on buyer tier
 */
export function getDailySpendLimit(buyerTier: BuyerTier): number {
  switch (buyerTier) {
    case 'TRUSTED':
      return 100000 // $1000/day
    case 'VERIFIED':
      return 50000 // $500/day
    case 'NEW':
    default:
      return 25000 // $250/day
  }
}

/**
 * Get total spent today (in cents) for a user
 */
export async function getTodaySpend(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const result = await prisma.purchase.aggregate({
    where: {
      buyerId: userId,
      status: 'COMPLETED',
      createdAt: {
        gte: startOfDay,
      },
    },
    _sum: {
      amountPaidCents: true,
    },
  })

  return result._sum.amountPaidCents || 0
}

/**
 * Check if a user can make a purchase of a given amount
 */
export async function canPurchase(
  userId: string,
  amountCents: number
): Promise<{
  allowed: boolean
  reason?: string
  todaySpent: number
  dailyLimit: number
  remaining: number
}> {
  // Get user with buyer tier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { buyerTier: true },
  })

  if (!user) {
    return {
      allowed: false,
      reason: 'User not found',
      todaySpent: 0,
      dailyLimit: 0,
      remaining: 0,
    }
  }

  const dailyLimit = getDailySpendLimit(user.buyerTier)
  const todaySpent = await getTodaySpend(userId)
  const remaining = dailyLimit - todaySpent

  if (amountCents > remaining) {
    return {
      allowed: false,
      reason: `This purchase exceeds your daily spending limit. You have $${(remaining / 100).toFixed(2)} remaining today.`,
      todaySpent,
      dailyLimit,
      remaining,
    }
  }

  return {
    allowed: true,
    todaySpent,
    dailyLimit,
    remaining,
  }
}

/**
 * Guest daily spend limit in cents ($50)
 * More restrictive than registered users to prevent fraud
 */
const GUEST_DAILY_LIMIT_CENTS = 5000

/**
 * Check if a guest can make a purchase of a given amount
 * Tracks by email address only (no account required)
 */
export async function canGuestPurchase(
  guestEmail: string,
  amountCents: number
): Promise<{
  allowed: boolean
  reason?: string
  todaySpend: number
  limit: number
}> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const result = await prisma.purchase.aggregate({
    where: {
      guestEmail: guestEmail,
      status: 'COMPLETED',
      createdAt: { gte: startOfDay },
    },
    _sum: { amountPaidCents: true },
  })

  const todaySpend = result._sum.amountPaidCents || 0
  const limit = GUEST_DAILY_LIMIT_CENTS

  if (todaySpend + amountCents > limit) {
    return {
      allowed: false,
      reason: `Guest daily limit of $${(limit / 100).toFixed(0)} exceeded. Create an account for higher limits.`,
      todaySpend,
      limit,
    }
  }

  return { allowed: true, todaySpend, limit }
}

/**
 * Get spend status for display
 */
export async function getSpendStatus(userId: string): Promise<{
  tier: BuyerTier
  todaySpent: number
  dailyLimit: number
  remaining: number
  percentUsed: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { buyerTier: true },
  })

  const buyerTier = user?.buyerTier || 'NEW'
  const dailyLimit = getDailySpendLimit(buyerTier)
  const todaySpent = await getTodaySpend(userId)
  const remaining = Math.max(0, dailyLimit - todaySpent)
  const percentUsed = dailyLimit > 0 ? (todaySpent / dailyLimit) * 100 : 0

  return {
    tier: buyerTier,
    todaySpent,
    dailyLimit,
    remaining,
    percentUsed,
  }
}
