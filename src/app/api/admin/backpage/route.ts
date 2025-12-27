import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/admin/backpage - Get all posts with filtering and pagination
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
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.BackPagePostWhereInput = {}

    // Status filter
    if (status !== 'all') {
      where.status = status as 'ACTIVE' | 'REMOVED'
    }

    // Category filter
    if (category !== 'all') {
      where.category = category as 'GENERAL' | 'SHOW_TELL' | 'LOOKING_FOR' | 'HELP'
    }

    const [posts, total, activeCount, pendingReportsCount] = await Promise.all([
      prisma.backPagePost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isBanned: true,
            },
          },
          _count: {
            select: {
              replies: true,
              reports: true,
            },
          },
        },
      }),
      prisma.backPagePost.count({ where }),
      prisma.backPagePost.count({ where: { status: 'ACTIVE' } }),
      prisma.backPageReport.count({ where: { status: 'PENDING' } }),
    ])

    return NextResponse.json({
      success: true,
      data: posts,
      activeCount,
      pendingReportsCount,
      pagination: {
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/backpage error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
