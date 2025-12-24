/**
 * GitHub OAuth Callback
 * Handles the redirect from GitHub after authorization
 */

import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const log = createLogger('github')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // This is the user ID we passed
  const error = searchParams.get('error')

  // Handle user denying access
  if (error) {
    log.warn('User denied access', { error })
    return redirect('/dashboard/settings?error=github_denied')
  }

  if (!code || !state) {
    log.error('Missing code or state in callback')
    return redirect('/dashboard/settings?error=github_invalid_callback')
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      log.error('Token exchange failed', { error: tokenData.error })
      return redirect('/dashboard/settings?error=github_token_failed')
    }

    const accessToken = tokenData.access_token

    // Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
    })

    if (!userResponse.ok) {
      log.error('Failed to fetch user profile', { status: userResponse.status })
      return redirect('/dashboard/settings?error=github_user_failed')
    }

    const githubUser = await userResponse.json()

    // Check if this GitHub account is already connected to another user
    const existingUser = await prisma.user.findUnique({
      where: { githubId: String(githubUser.id) },
    })

    if (existingUser && existingUser.id !== state) {
      log.warn('Account already linked to another user', { githubId: githubUser.id })
      return redirect('/dashboard/settings?error=github_already_linked')
    }

    // Update user in database
    await prisma.user.update({
      where: { id: state },
      data: {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        githubVerifiedAt: new Date(),
        githubAccessToken: accessToken,
      },
    })

    log.info('Successfully linked GitHub account', { username: githubUser.login, userId: state })
    return redirect('/dashboard/settings?github=connected')
  } catch (error) {
    log.error('Callback error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return redirect('/dashboard/settings?error=github_error')
  }
}
