import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/health - Health check endpoint with database connectivity verification
export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp,
    })
  } catch (error) {
    console.error('[health] Database connectivity check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp,
      },
      { status: 503 }
    )
  }
}
