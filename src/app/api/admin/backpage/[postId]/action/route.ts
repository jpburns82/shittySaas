import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_ACTIONS = ['remove_post', 'warn_user', 'ban_user'] as const
type ActionType = (typeof VALID_ACTIONS)[number]

// POST /api/admin/backpage/[postId]/action - Take moderation action on a post/author
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { postId } = await params
    const body = await request.json()
    const { action, notes, reportId } = body as { action: ActionType; notes?: string; reportId?: string }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    const post = await prisma.backPagePost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            isAdmin: true,
            isBanned: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    const targetUserId = post.authorId

    // Execute the action
    switch (action) {
      case 'remove_post': {
        if (post.status === 'REMOVED') {
          return NextResponse.json(
            { success: false, error: 'Post is already removed' },
            { status: 400 }
          )
        }

        await prisma.backPagePost.update({
          where: { id: postId },
          data: {
            status: 'REMOVED',
            removedAt: new Date(),
            removedById: session.user.id,
            removalReason: notes || 'Removed by admin',
          },
        })

        await prisma.auditLog.create({
          data: {
            action: 'backpage_post.removed',
            entityType: 'backpage_post',
            entityId: postId,
            actorId: session.user.id,
            metadata: {
              postTitle: post.title,
              authorId: targetUserId,
              reason: notes || 'Removed by admin',
              reportId,
            },
          },
        })
        break
      }

      case 'warn_user': {
        // Map reason to warning reason
        const warningReason = 'POLICY_VIOLATION'

        await prisma.userWarning.create({
          data: {
            userId: targetUserId,
            reason: warningReason,
            notes: notes || 'Warning issued for BackPage content violation',
            issuedBy: session.user.id,
          },
        })

        // Send internal message to notify the user of the warning
        // Find or create thread between admin and user
        let thread = await prisma.messageThread.findFirst({
          where: {
            OR: [
              { buyerId: session.user.id, sellerId: targetUserId },
              { buyerId: targetUserId, sellerId: session.user.id },
            ],
            listingId: null,
          },
        })

        if (!thread) {
          thread = await prisma.messageThread.create({
            data: {
              buyerId: targetUserId,
              sellerId: session.user.id, // Admin as seller (support role)
            },
          })
        }

        const warningMessage = `⚠️ **Account Warning**

Your account has received an official warning for a policy violation.

**Reason:** ${warningReason.replace(/_/g, ' ')}
${notes ? `**Details:** ${notes}` : ''}
**Related post:** "${post.title}"

Repeated violations may result in account suspension or permanent ban. Please review our community guidelines.

If you believe this warning was issued in error, you may reply to this message.`

        await prisma.message.create({
          data: {
            senderId: session.user.id,
            receiverId: targetUserId,
            content: warningMessage,
            threadId: thread.id,
          },
        })

        await prisma.auditLog.create({
          data: {
            action: 'user.warned',
            entityType: 'user',
            entityId: targetUserId,
            actorId: session.user.id,
            metadata: {
              reason: warningReason,
              notes,
              postId,
              reportId,
            },
          },
        })
        break
      }

      case 'ban_user': {
        if (post.author.isAdmin) {
          return NextResponse.json(
            { success: false, error: 'Cannot ban admin users' },
            { status: 400 }
          )
        }

        if (post.author.isBanned) {
          return NextResponse.json(
            { success: false, error: 'User is already banned' },
            { status: 400 }
          )
        }

        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            banReason: notes || 'Banned for BackPage content violation',
          },
        })

        await prisma.auditLog.create({
          data: {
            action: 'user.banned',
            entityType: 'user',
            entityId: targetUserId,
            actorId: session.user.id,
            metadata: {
              reason: notes || 'Banned for BackPage content violation',
              postId,
              reportId,
            },
          },
        })
        break
      }
    }

    // If there's a reportId, update it to ACTION_TAKEN
    if (reportId) {
      await prisma.backPageReport.update({
        where: { id: reportId },
        data: {
          status: 'ACTION_TAKEN',
          resolution: `${action}: ${notes || 'No additional notes'}`,
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
    })
  } catch (error) {
    console.error('POST /api/admin/backpage/[postId]/action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to take action' },
      { status: 500 }
    )
  }
}
