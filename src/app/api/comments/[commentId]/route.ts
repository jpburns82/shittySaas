import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { editCommentSchema } from '@/lib/validations'

interface RouteContext {
  params: Promise<{ commentId: string }>
}

// PATCH /api/comments/[commentId] - Edit a comment (auth, owner only, within edit window)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = await context.params

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        canEditUntil: true,
        isRemoved: true,
      },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.isRemoved) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a deleted comment' },
        { status: 400 }
      )
    }

    // Check ownership
    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      )
    }

    // Check edit window
    if (comment.canEditUntil && new Date() > comment.canEditUntil) {
      return NextResponse.json(
        { success: false, error: 'Edit window has expired (15 minutes)' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = editCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content } = validation.data

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerifiedSeller: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedComment,
    })
  } catch (error) {
    console.error('PATCH /api/comments/[commentId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[commentId] - Delete a comment (auth, owner only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { commentId } = await context.params

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        listingId: true,
        isRemoved: true,
      },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.isRemoved) {
      return NextResponse.json(
        { success: false, error: 'Comment already deleted' },
        { status: 400 }
      )
    }

    // Check ownership (or admin)
    if (comment.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isRemoved: true,
        removedReason: session.user.isAdmin ? 'Removed by admin' : 'Deleted by author',
      },
    })

    // Decrement listing comment count
    await prisma.listing.update({
      where: { id: comment.listingId },
      data: { commentCount: { decrement: 1 } },
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted',
    })
  } catch (error) {
    console.error('DELETE /api/comments/[commentId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
