/**
 * GitHub OAuth Initiation
 * Redirects user to GitHub to authorize the app
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return redirect('/login?redirect=/dashboard/settings')
  }

  if (!process.env.GITHUB_CLIENT_ID) {
    console.error('[GitHub] GITHUB_CLIENT_ID not configured')
    return redirect('/dashboard/settings?error=github_not_configured')
  }

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'read:user repo',
    state: session.user.id, // Used to verify the callback
  })

  return redirect(`https://github.com/login/oauth/authorize?${params}`)
}
