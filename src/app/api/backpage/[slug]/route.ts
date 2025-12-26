import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ slug: string }>
}

// ===========================================
// GET /api/backpage/[slug] - Get single post (Public)
// Returns post + replies + userVote (if logged in)
// ===========================================

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const session = await auth()

    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            sellerTier: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                sellerTier: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(post.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This post has expired' },
        { status: 410 }
      )
    }

    // Get user's vote if logged in
    let userVote = 0
    if (session?.user?.id) {
      const vote = await prisma.backPageVote.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: session.user.id,
          },
        },
      })
      userVote = vote?.value || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        userVote,
      },
    })
  } catch (error) {
    console.error('GET /api/backpage/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// ===========================================
// DELETE /api/backpage/[slug] - Delete post (Auth required)
// Only author or admin can delete
// ===========================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      select: { id: true, authorId: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check ownership (author or admin)
    if (post.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete post (cascade deletes replies and votes)
    await prisma.backPagePost.delete({ where: { id: post.id } })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('DELETE /api/backpage/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
