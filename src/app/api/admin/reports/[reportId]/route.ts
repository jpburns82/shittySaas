import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports/[reportId] - Get report details
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

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            status: true,
            seller: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
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
    const reporterHistory = await prisma.report.count({
      where: { reporterId: report.reporterId },
    })

    // Get reported entity owner's history (for listings)
    let reportedUserHistory = null
    if (report.listing) {
      const [reportsAgainst, warnings] = await Promise.all([
        prisma.report.count({
          where: {
            OR: [
              { listing: { sellerId: report.listing.seller.id } },
              { userId: report.listing.seller.id },
            ],
          },
        }),
        prisma.userWarning.count({
          where: { userId: report.listing.seller.id },
        }),
      ])
      reportedUserHistory = { reportsAgainst, warnings }
    } else if (report.userId) {
      const [reportsAgainst, warnings] = await Promise.all([
        prisma.report.count({
          where: { userId: report.userId },
        }),
        prisma.userWarning.count({
          where: { userId: report.userId },
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
    console.error('GET /api/admin/reports/[reportId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/reports/[reportId] - Update report status
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

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolution: resolution || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'report.reviewed',
        entityType: 'report',
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
    console.error('PATCH /api/admin/reports/[reportId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    )
  }
}
