import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ slug: string }>
}

// ===========================================
// POST /api/backpage/[slug]/vote - Vote on post (Auth required)
// Supports toggle: same vote removes, different vote switches
// ===========================================

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
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

    // Find the post
    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      select: { id: true, expiresAt: true, authorId: true },
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
    const validation = voteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value. Must be 1 or -1.' },
        { status: 400 }
      )
    }

    const { value } = validation.data

    // Get existing vote
    const existingVote = await prisma.backPageVote.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId: session.user.id,
        },
      },
    })

    let action: 'created' | 'removed' | 'changed'
    let newUserVote: number

    if (existingVote) {
      if (existingVote.value === value) {
        // Same vote = toggle OFF (remove vote)
        await prisma.$transaction(async (tx) => {
          await tx.backPageVote.delete({ where: { id: existingVote.id } })
          await tx.backPagePost.update({
            where: { id: post.id },
            data: {
              upvotes: value === 1 ? { decrement: 1 } : undefined,
              downvotes: value === -1 ? { decrement: 1 } : undefined,
            },
          })
        })
        action = 'removed'
        newUserVote = 0
      } else {
        // Different vote = change vote (FIXED: +1 new, -1 old)
        const wasUp = existingVote.value === 1
        const wasDown = existingVote.value === -1
        const nowUp = value === 1
        const nowDown = value === -1

        await prisma.$transaction(async (tx) => {
          await tx.backPageVote.update({
            where: { id: existingVote.id },
            data: { value },
          })
          await tx.backPagePost.update({
            where: { id: post.id },
            data: {
              upvotes: nowUp ? { increment: 1 } : wasUp ? { decrement: 1 } : undefined,
              downvotes: nowDown ? { increment: 1 } : wasDown ? { decrement: 1 } : undefined,
            },
          })
        })
        action = 'changed'
        newUserVote = value
      }
    } else {
      // No existing vote = create new
      await prisma.$transaction(async (tx) => {
        await tx.backPageVote.create({
          data: {
            postId: post.id,
            userId: session.user.id,
            value,
          },
        })
        await tx.backPagePost.update({
          where: { id: post.id },
          data: {
            upvotes: value === 1 ? { increment: 1 } : undefined,
            downvotes: value === -1 ? { increment: 1 } : undefined,
          },
        })
      })
      action = 'created'
      newUserVote = value
    }

    // Get updated counts
    const updated = await prisma.backPagePost.findUnique({
      where: { id: post.id },
      select: { upvotes: true, downvotes: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        action,
        upvotes: updated?.upvotes ?? 0,
        downvotes: updated?.downvotes ?? 0,
        userVote: newUserVote,
      },
    })
  } catch (error) {
    console.error('POST /api/backpage/[slug]/vote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 500 }
    )
  }
}
