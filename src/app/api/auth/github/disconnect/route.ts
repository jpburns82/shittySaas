/**
 * GitHub Disconnect
 * Removes GitHub connection from user account
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const log = createLogger('github')

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

    log.info('Disconnected GitHub account', { userId: session.user.id })
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Disconnect error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
