import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/admin/backpage/reports - Get all BackPage reports with filtering and pagination
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
    const reason = searchParams.get('reason') || 'all'
    const type = searchParams.get('type') || 'all' // 'post' or 'reply'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.BackPageReportWhereInput = {}

    // Status filter
    if (status !== 'all') {
      where.status = status as 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED'
    }

    // Reason filter
    if (reason !== 'all') {
      where.reason = reason as 'SPAM' | 'HARASSMENT' | 'SCAM' | 'OFF_TOPIC' | 'OTHER'
    }

    // Type filter (post or reply)
    if (type === 'post') {
      where.postId = { not: null }
      where.replyId = null
    } else if (type === 'reply') {
      where.replyId = { not: null }
    }

    const [reports, total, pendingCount] = await Promise.all([
      prisma.backPageReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
              category: true,
              status: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          reply: {
            select: {
              id: true,
              body: true,
              status: true,
              post: {
                select: {
                  slug: true,
                  title: true,
                },
              },
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      }),
      prisma.backPageReport.count({ where }),
      prisma.backPageReport.count({ where: { status: 'PENDING' } }),
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
    console.error('GET /api/admin/backpage/reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
