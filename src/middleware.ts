import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateCSRFToken, CSRF_COOKIE_NAME } from '@/lib/csrf'

/**
 * Middleware to set CSRF token cookie if not present
 * Runs on all routes to ensure token is available for form submissions
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Check if CSRF token cookie exists
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)

  if (!existingToken) {
    // Generate and set new CSRF token
    const token = generateCSRFToken()

    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be accessible to JavaScript for header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return response
}

// Only run middleware on pages and API routes (not static assets)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
