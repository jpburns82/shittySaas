import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BACKPAGE_LIMITS } from '@/lib/backpage'

type RouteContext = {
  params: Promise<{ slug: string }>
}

// ===========================================
// POST /api/backpage/[slug]/reply - Add reply (Auth required)
// ===========================================

const createReplySchema = z.object({
  content: z
    .string()
    .min(BACKPAGE_LIMITS.REPLY_MIN, `Reply must be at least ${BACKPAGE_LIMITS.REPLY_MIN} characters`)
    .max(BACKPAGE_LIMITS.REPLY_MAX, `Reply must be at most ${BACKPAGE_LIMITS.REPLY_MAX} characters`),
})

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true, deletedAt: true },
    })

    if (user?.isBanned || user?.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Your account is not active' },
        { status: 403 }
      )
    }

    // Find the post
    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      select: { id: true, expiresAt: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if post is expired
    if (new Date(post.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This post has expired' },
        { status: 410 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = createReplySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content } = validation.data

    // Create reply and increment count atomically
    const reply = await prisma.$transaction(async (tx) => {
      const newReply = await tx.backPageReply.create({
        data: {
          body: content,
          postId: post.id,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              sellerTier: true,
            },
          },
        },
      })

      // Increment reply count atomically
      await tx.backPagePost.update({
        where: { id: post.id },
        data: { replyCount: { increment: 1 } },
      })

      return newReply
    })

    return NextResponse.json(
      { success: true, data: reply },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/backpage/[slug]/reply error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
