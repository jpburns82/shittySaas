import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { COMMENT_LIMITS } from '@/lib/constants'

interface RouteContext {
  params: Promise<{ commentId: string }>
}

const reportCommentSchema = z.object({
  reason: z.enum([
    'SPAM',
    'STOLEN_CODE',
    'MISLEADING',
    'SCAM',
    'MALWARE',
    'HARASSMENT',
    'ILLEGAL',
    'COPYRIGHT',
    'OTHER',
  ]),
  details: z
    .string()
    .max(COMMENT_LIMITS.MAX_REPORT_DETAILS_LENGTH, 'Details must be under 300 characters')
    .optional(),
})

// POST /api/comments/[commentId]/report - Report a comment (auth required)
export async function POST(request: NextRequest, context: RouteContext) {
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
        { success: false, error: 'Cannot report a deleted comment' },
        { status: 400 }
      )
    }

    // Cannot report own comment
    if (comment.authorId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own comment' },
        { status: 400 }
      )
    }

    // Check for existing report from this user
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        commentId,
        entityType: 'COMMENT',
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this comment' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = reportCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { reason, details } = validation.data

    // Create the report
    const report = await prisma.report.create({
      data: {
        entityType: 'COMMENT',
        reason,
        details: details || null,
        commentId,
        reporterId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        message: 'Comment reported successfully',
      },
    })
  } catch (error) {
    console.error('POST /api/comments/[commentId]/report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to report comment' },
      { status: 500 }
    )
  }
}
