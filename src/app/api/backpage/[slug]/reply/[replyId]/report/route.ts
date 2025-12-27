import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ slug: string; replyId: string }>
}

const reportSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'SCAM', 'OFF_TOPIC', 'OTHER']),
  details: z.string().max(500).optional(),
})

// POST /api/backpage/[slug]/reply/[replyId]/report - Report a reply
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to report' },
        { status: 401 }
      )
    }

    const { replyId } = await context.params

    // Find the reply
    const reply = await prisma.backPageReply.findUnique({
      where: { id: replyId },
      select: { id: true, authorId: true, status: true },
    })

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      )
    }

    // Can't report removed replies
    if (reply.status === 'REMOVED') {
      return NextResponse.json(
        { success: false, error: 'This reply has been removed' },
        { status: 400 }
      )
    }

    // Can't report your own reply
    if (reply.authorId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot report your own reply' },
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
          replyId: reply.id,
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
          { success: false, error: 'You have already reported this reply' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('POST /api/backpage/[slug]/reply/[replyId]/report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
