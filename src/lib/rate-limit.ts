/**
 * Rate Limiting
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Protects auth endpoints from brute force attacks.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Auth endpoint rate limiter
 * 5 requests per hour per IP
 */
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:auth',
  analytics: true,
})

/**
 * Password reset rate limiter (more lenient)
 * 10 requests per hour per IP
 */
export const resetPasswordRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:reset',
  analytics: true,
})

/**
 * Get client IP from request headers
 * Works with proxies (Cloudflare, Vercel, etc.)
 */
export function getClientIp(request: Request): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first IP
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // Fallback - should rarely happen in production
  return '127.0.0.1'
}

/**
 * Check rate limit and return result
 * Returns { success: true } if allowed, { success: false, reset, remaining } if blocked
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean
  remaining?: number
  reset?: number
  limit?: number
}> {
  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    }
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    // but log the error
    console.error('[rate-limit] Error checking rate limit:', error)
    return { success: true }
  }
}
