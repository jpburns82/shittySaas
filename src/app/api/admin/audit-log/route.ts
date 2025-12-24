import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { TIME_MS } from '@/lib/constants'
import { createLogger } from '@/lib/logger'

const log = createLogger('audit-log')

// GET /api/admin/audit-log - Get audit log entries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'all'
    const entityType = searchParams.get('entityType') || 'all'
    const timeRange = searchParams.get('timeRange') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.AuditLogWhereInput = {}

    // Action filter
    if (action && action !== 'all') {
      where.action = { contains: action, mode: 'insensitive' }
    }

    // Entity type filter
    if (entityType && entityType !== 'all') {
      where.entityType = entityType
    }

    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - TIME_MS.DAY)
          break
        case '7d':
          startDate = new Date(now.getTime() - TIME_MS.WEEK)
          break
        case '30d':
          startDate = new Date(now.getTime() - TIME_MS.MONTH)
          break
        default:
          startDate = new Date(0)
      }

      where.createdAt = { gte: startDate }
    }

    // Search filter (entity ID or action)
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { actorId: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Fetch actor usernames for entries that have actorId
    const actorIds = entries
      .map((e) => e.actorId)
      .filter((id): id is string => id !== null)

    const actors = actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, username: true },
        })
      : []

    const actorMap = new Map(actors.map((a) => [a.id, a.username]))

    // Enrich entries with actor usernames
    const enrichedEntries = entries.map((entry) => ({
      ...entry,
      actorUsername: entry.actorId ? actorMap.get(entry.actorId) || null : null,
    }))

    return NextResponse.json({
      success: true,
      data: enrichedEntries,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    log.error('GET /api/admin/audit-log error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}
