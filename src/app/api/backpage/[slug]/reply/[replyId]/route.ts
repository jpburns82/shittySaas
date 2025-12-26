import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ slug: string; replyId: string }>
}

// ===========================================
// DELETE /api/backpage/[slug]/reply/[replyId] - Delete reply (Auth required)
// Only author or admin can delete
// ===========================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug, replyId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the post
    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Find the reply
    const reply = await prisma.backPageReply.findUnique({
      where: { id: replyId },
      select: { id: true, postId: true, authorId: true },
    })

    if (!reply || reply.postId !== post.id) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Check ownership (author or admin)
    if (reply.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete reply and decrement count atomically
    await prisma.$transaction(async (tx) => {
      await tx.backPageReply.delete({ where: { id: replyId } })
      await tx.backPagePost.update({
        where: { id: post.id },
        data: { replyCount: { decrement: 1 } },
      })
    })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('DELETE /api/backpage/[slug]/reply/[replyId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete reply' },
      { status: 500 }
    )
  }
}
