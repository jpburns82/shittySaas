/**
 * GitHub Disconnect
 * Removes GitHub connection from user account
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        githubId: null,
        githubUsername: null,
        githubVerifiedAt: null,
        githubAccessToken: null,
      },
    })

    console.log(`[GitHub] Disconnected for user ${session.user.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GitHub] Disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
