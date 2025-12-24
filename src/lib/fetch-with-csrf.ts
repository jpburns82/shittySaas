/**
 * Fetch wrapper that automatically includes CSRF token
 *
 * Use this for all POST/PUT/DELETE requests to protected endpoints
 */

// Constants duplicated here to avoid importing server-only code from csrf.ts
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Get CSRF token from cookie
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`))
  return match ? match[2] : null
}

/**
 * Fetch with automatic CSRF token
 * Adds the CSRF token header to all requests
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFToken()

  const headers = new Headers(options.headers)

  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
