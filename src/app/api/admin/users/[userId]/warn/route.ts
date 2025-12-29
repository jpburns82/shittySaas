import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWarningEmail } from '@/lib/email'

const VALID_WARNING_REASONS = ['INAPPROPRIATE', 'HARASSMENT', 'SCAM', 'POLICY_VIOLATION', 'OTHER'] as const

// POST /api/admin/users/[userId]/warn - Issue warning to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()
    const { reason, notes } = body

    // Validate reason
    if (!reason || !VALID_WARNING_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid warning reason' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create warning (without thread context)
    const warning = await prisma.userWarning.create({
      data: {
        userId,
        reason: reason as 'INAPPROPRIATE' | 'HARASSMENT' | 'SCAM' | 'POLICY_VIOLATION' | 'OTHER',
        notes: notes || null,
        issuedBy: session.user.id,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'user.warned',
        entityType: 'user',
        entityId: userId,
        actorId: session.user.id,
        metadata: {
          reason,
          notes: notes || null,
        },
      },
    })

    // Send warning email to user (non-blocking)
    if (user.email) {
      try {
        await sendWarningEmail(user.email, user.username, reason, notes || undefined)
      } catch (error) {
        console.error('Failed to send warning email:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: warning,
    })
  } catch (error) {
    console.error('POST /api/admin/users/[userId]/warn error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to issue warning' },
      { status: 500 }
    )
  }
}
