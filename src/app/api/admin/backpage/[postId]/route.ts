import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/backpage/[postId] - Get post details for admin
export async function GET(
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

    const post = await prisma.backPagePost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isBanned: true,
            createdAt: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
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
              select: { reports: true },
            },
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
          select: {
            replies: true,
            reports: true,
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

    // Get author's history
    const [authorPosts, authorReportsAgainst, authorWarnings] = await Promise.all([
      prisma.backPagePost.count({ where: { authorId: post.authorId } }),
      prisma.backPageReport.count({
        where: {
          OR: [
            { post: { authorId: post.authorId } },
            { reply: { authorId: post.authorId } },
          ],
        },
      }),
      prisma.userWarning.count({ where: { userId: post.authorId } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        authorHistory: {
          totalPosts: authorPosts,
          reportsAgainst: authorReportsAgainst,
          warnings: authorWarnings,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/admin/backpage/[postId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/backpage/[postId] - Remove a post
export async function DELETE(
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
    const body = await request.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    const post = await prisma.backPagePost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, authorId: true, status: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status === 'REMOVED') {
      return NextResponse.json(
        { success: false, error: 'Post is already removed' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.backPagePost.update({
      where: { id: postId },
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
        action: 'backpage_post.removed',
        entityType: 'backpage_post',
        entityId: postId,
        actorId: session.user.id,
        metadata: {
          postTitle: post.title,
          authorId: post.authorId,
          reason: reason || 'Removed by admin',
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedPost,
    })
  } catch (error) {
    console.error('DELETE /api/admin/backpage/[postId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove post' },
      { status: 500 }
    )
  }
}
