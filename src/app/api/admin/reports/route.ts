import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/admin/reports - Get all reports with filtering and pagination
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
    const status = searchParams.get('status') || 'all'
    const entityType = searchParams.get('entityType') || 'all'
    const reason = searchParams.get('reason') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.ReportWhereInput = {}

    // Status filter
    if (status !== 'all') {
      where.status = status as 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED'
    }

    // Entity type filter
    if (entityType !== 'all') {
      where.entityType = entityType as 'LISTING' | 'COMMENT' | 'USER' | 'MESSAGE'
    }

    // Reason filter
    if (reason !== 'all') {
      where.reason = reason as Prisma.EnumReportReasonFilter['equals']
    }

    const [reports, total, pendingCount] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              seller: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      prisma.report.count({ where }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ])

    return NextResponse.json({
      success: true,
      data: reports,
      pendingCount,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
