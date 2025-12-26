import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ===========================================
// GET /api/cron/cleanup-backpage
// Cleanup expired BackPage posts
// Protected by CRON_SECRET
// Schedule: Every Monday at 00:00 UTC
// ===========================================

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const deleted = await prisma.backPagePost.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })

    console.warn(`[Cleanup BackPage] Deleted ${deleted.count} expired posts`)

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cleanup BackPage] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
