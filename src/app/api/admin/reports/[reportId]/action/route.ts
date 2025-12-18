import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_ACTIONS = ['remove_content', 'warn_user', 'ban_user'] as const
type ActionType = (typeof VALID_ACTIONS)[number]

// POST /api/admin/reports/[reportId]/action - Take action on a report
export async function POST(
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
    const { action, notes } = body as { action: ActionType; notes?: string }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            sellerId: true,
            seller: { select: { username: true } },
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

    // Determine target user ID
    let targetUserId: string | null = null
    if (report.listing) {
      targetUserId = report.listing.sellerId
    } else if (report.userId) {
      targetUserId = report.userId
    }

    // Execute the action
    switch (action) {
      case 'remove_content': {
        if (report.entityType === 'LISTING' && report.listingId) {
          await prisma.listing.update({
            where: { id: report.listingId },
            data: { status: 'REMOVED' },
          })
          await prisma.auditLog.create({
            data: {
              action: 'listing.removed_by_admin',
              entityType: 'listing',
              entityId: report.listingId,
              actorId: session.user.id,
              metadata: {
                reportId,
                reason: notes || 'Removed due to report',
              },
            },
          })
        } else if (report.entityType === 'COMMENT' && report.commentId) {
          await prisma.comment.update({
            where: { id: report.commentId },
            data: {
              isRemoved: true,
              removedReason: notes || 'Removed due to report',
            },
          })
          await prisma.auditLog.create({
            data: {
              action: 'comment.removed_by_admin',
              entityType: 'comment',
              entityId: report.commentId,
              actorId: session.user.id,
              metadata: {
                reportId,
                reason: notes || 'Removed due to report',
              },
            },
          })
        }
        break
      }

      case 'warn_user': {
        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: 'No user to warn for this report' },
            { status: 400 }
          )
        }

        // Map report reason to warning reason
        const warningReasonMap: Record<string, string> = {
          SPAM: 'POLICY_VIOLATION',
          STOLEN_CODE: 'POLICY_VIOLATION',
          MISLEADING: 'POLICY_VIOLATION',
          SCAM: 'SCAM',
          MALWARE: 'POLICY_VIOLATION',
          HARASSMENT: 'HARASSMENT',
          ILLEGAL: 'POLICY_VIOLATION',
          COPYRIGHT: 'POLICY_VIOLATION',
          OTHER: 'OTHER',
        }

        const warningReason = warningReasonMap[report.reason] || 'POLICY_VIOLATION'

        await prisma.userWarning.create({
          data: {
            userId: targetUserId,
            reason: warningReason as 'INAPPROPRIATE' | 'HARASSMENT' | 'SCAM' | 'POLICY_VIOLATION' | 'OTHER',
            notes: notes || `Warning issued from report: ${report.reason}`,
            issuedBy: session.user.id,
          },
        })

        await prisma.auditLog.create({
          data: {
            action: 'user.warned',
            entityType: 'user',
            entityId: targetUserId,
            actorId: session.user.id,
            metadata: {
              reportId,
              reason: warningReason,
              notes,
            },
          },
        })
        break
      }

      case 'ban_user': {
        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: 'No user to ban for this report' },
            { status: 400 }
          )
        }

        // Check if target is admin
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { isAdmin: true, username: true },
        })

        if (targetUser?.isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Cannot ban admin users' },
            { status: 400 }
          )
        }

        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            banReason: notes || `Banned due to report: ${report.reason}`,
          },
        })

        await prisma.auditLog.create({
          data: {
            action: 'user.banned',
            entityType: 'user',
            entityId: targetUserId,
            actorId: session.user.id,
            metadata: {
              reportId,
              reason: notes || `Banned due to report: ${report.reason}`,
            },
          },
        })
        break
      }
    }

    // Update report status to ACTION_TAKEN
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'ACTION_TAKEN',
        resolution: `${action}: ${notes || 'No additional notes'}`,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'report.action_taken',
        entityType: 'report',
        entityId: reportId,
        actorId: session.user.id,
        metadata: {
          action,
          notes,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedReport,
    })
  } catch (error) {
    console.error('POST /api/admin/reports/[reportId]/action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to take action' },
      { status: 500 }
    )
  }
}
