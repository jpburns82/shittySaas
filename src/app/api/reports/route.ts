import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createReportSchema } from '@/lib/validations'

// POST /api/reports - Create a report
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { entityType, reason, details, listingId, commentId, userId } = validation.data

    // Validate that the appropriate ID is provided
    if (entityType === 'LISTING' && !listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    if (entityType === 'COMMENT' && !commentId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    if (entityType === 'USER' && !userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check for existing report from this user for the same entity
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        entityType,
        listingId: listingId || null,
        commentId: commentId || null,
        userId: userId || null,
        status: 'PENDING',
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        entityType,
        reason,
        details: details || null,
        listingId: listingId || null,
        commentId: commentId || null,
        userId: userId || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
