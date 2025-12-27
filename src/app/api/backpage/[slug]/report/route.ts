import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ slug: string }>
}

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'SCAM', 'OFF_TOPIC', 'OTHER']),
  details: z.string().max(500).optional(),
})

// POST /api/backpage/[slug]/report - Report a post
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to report' },
        { status: 401 }
      )
    }

    const { slug } = await context.params

    // Find the post
    const post = await prisma.backPagePost.findUnique({
      where: { slug },
      select: { id: true, authorId: true, status: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Can't report removed posts
    if (post.status === 'REMOVED') {
      return NextResponse.json(
        { success: false, error: 'This post has been removed' },
        { status: 400 }
      )
    }

    // Can't report your own post
    if (post.authorId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own post' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = reportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { reason, details } = validation.data

    // Create report (unique constraint prevents duplicates)
    try {
      const report = await prisma.backPageReport.create({
        data: {
          postId: post.id,
          reporterId: session.user.id,
          reason,
          details: details || null,
        },
      })

      return NextResponse.json({
        success: true,
        data: { id: report.id },
        message: 'Report submitted. Thank you for helping keep the community safe.',
      })
    } catch (error) {
      // Check if it's a unique constraint violation
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'You have already reported this post' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('POST /api/backpage/[slug]/report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
