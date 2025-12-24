/**
 * CSRF Protection
 *
 * Implements double-submit cookie pattern:
 * 1. Server sets a random CSRF token as HTTP-only cookie
 * 2. Client must include the same token in request header
 * 3. Server validates cookie value matches header value
 */

import { randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createLogger } from './logger'

const log = createLogger('csrf')

export const CSRF_COOKIE_NAME = 'csrf_token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token from request header against cookie
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  try {
    const headerToken = request.headers.get(CSRF_HEADER_NAME)
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

    // Both tokens must exist
    if (!headerToken || !cookieToken) {
      return false
    }

    // Tokens must be same length (prevent timing attack on length check)
    if (headerToken.length !== cookieToken.length) {
      return false
    }

    // Use timing-safe comparison
    return timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    )
  } catch (error) {
    log.error('Validation error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return false
  }
}

/**
 * Get the current CSRF token from cookies (for client-side use)
 * Returns null if no token exists
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
  } catch {
    return null
  }
}
