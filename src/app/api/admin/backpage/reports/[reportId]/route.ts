import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/backpage/reports/[reportId] - Get report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { reportId } = await params

    const report = await prisma.backPageReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
            body: true,
            category: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isBanned: true,
              },
            },
          },
        },
        reply: {
          select: {
            id: true,
            body: true,
            status: true,
            createdAt: true,
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
                avatarUrl: true,
                isBanned: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // Get reporter's report history
    const reporterHistory = await prisma.backPageReport.count({
      where: { reporterId: report.reporterId },
    })

    // Get reported user's history
    const targetUserId = report.post?.author.id || report.reply?.author.id
    let reportedUserHistory = null
    if (targetUserId) {
      const [reportsAgainst, warnings] = await Promise.all([
        prisma.backPageReport.count({
          where: {
            OR: [
              { post: { authorId: targetUserId } },
              { reply: { authorId: targetUserId } },
            ],
          },
        }),
        prisma.userWarning.count({
          where: { userId: targetUserId },
        }),
      ])
      reportedUserHistory = { reportsAgainst, warnings }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        reporterHistory,
        reportedUserHistory,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/backpage/reports/[reportId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/backpage/reports/[reportId] - Update report status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { reportId } = await params
    const body = await request.json()
    const { status, resolution } = body

    const validStatuses = ['REVIEWED', 'ACTION_TAKEN', 'DISMISSED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const report = await prisma.backPageReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    const updatedReport = await prisma.backPageReport.update({
      where: { id: reportId },
      data: {
        status,
        resolution: resolution || null,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'backpage_report.reviewed',
        entityType: 'backpage_report',
        entityId: reportId,
        actorId: session.user.id,
        metadata: {
          previousStatus: report.status,
          newStatus: status,
          resolution: resolution || null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedReport,
    })
  } catch (error) {
    console.error('PATCH /api/admin/backpage/reports/[reportId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    )
  }
}
