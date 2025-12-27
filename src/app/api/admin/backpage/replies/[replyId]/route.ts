import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/backpage/replies/[replyId] - Get reply details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { replyId } = await params

    const reply = await prisma.backPageReply.findUnique({
      where: { id: replyId },
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
        post: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
        removedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: { reports: true },
        },
      },
    })

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reply,
    })
  } catch (error) {
    console.error('GET /api/admin/backpage/replies/[replyId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reply' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/backpage/replies/[replyId] - Remove a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { replyId } = await params
    const body = await request.json().catch(() => ({}))
    const { reason, reportId } = body as { reason?: string; reportId?: string }

    const reply = await prisma.backPageReply.findUnique({
      where: { id: replyId },
      include: {
        post: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    })

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      )
    }

    if (reply.status === 'REMOVED') {
      return NextResponse.json(
        { success: false, error: 'Reply is already removed' },
        { status: 400 }
      )
    }

    const updatedReply = await prisma.backPageReply.update({
      where: { id: replyId },
      data: {
        status: 'REMOVED',
        removedAt: new Date(),
        removedById: session.user.id,
        removalReason: reason || 'Removed by admin',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'backpage_reply.removed',
        entityType: 'backpage_reply',
        entityId: replyId,
        actorId: session.user.id,
        metadata: {
          postSlug: reply.post.slug,
          postTitle: reply.post.title,
          authorId: reply.authorId,
          contentPreview: reply.body.substring(0, 100),
          reason: reason || 'Removed by admin',
          reportId,
        },
      },
    })

    // If there's a reportId, update it to ACTION_TAKEN
    if (reportId) {
      await prisma.backPageReport.update({
        where: { id: reportId },
        data: {
          status: 'ACTION_TAKEN',
          resolution: `Reply removed: ${reason || 'No additional notes'}`,
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedReply,
    })
  } catch (error) {
    console.error('DELETE /api/admin/backpage/replies/[replyId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove reply' },
      { status: 500 }
    )
  }
}
