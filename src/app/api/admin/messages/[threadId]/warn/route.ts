import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_WARNING_REASONS = ['INAPPROPRIATE', 'HARASSMENT', 'SCAM', 'POLICY_VIOLATION', 'OTHER'] as const

// POST /api/admin/messages/[threadId]/warn - Issue warning to user in thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { threadId } = await params
    const body = await request.json()
    const { userId, reason, notes } = body

    // Validate reason
    if (!reason || !VALID_WARNING_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid warning reason' },
        { status: 400 }
      )
    }

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify thread exists
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
      },
    })

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Verify the user is part of this thread
    if (userId !== thread.buyerId && userId !== thread.sellerId) {
      return NextResponse.json(
        { success: false, error: 'User is not a participant in this thread' },
        { status: 400 }
      )
    }

    // Create warning
    const warning = await prisma.userWarning.create({
      data: {
        userId,
        threadId,
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
          threadId,
          reason,
          notes: notes || null,
        },
      },
    })

    // Send a system message to the thread notifying about the warning
    const warnedUser = userId === thread.buyerId ? thread.buyer : thread.seller
    const warningReasonTextMap: Record<string, string> = {
      INAPPROPRIATE: 'inappropriate content',
      HARASSMENT: 'harassment',
      SCAM: 'potential scam behavior',
      POLICY_VIOLATION: 'policy violation',
      OTHER: 'policy concerns',
    }
    const warningReasonText = warningReasonTextMap[reason] || 'policy concerns'

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: userId,
        threadId,
        listingId: thread.listingId,
        content: `⚠️ ADMIN WARNING: @${warnedUser.username} has received a warning for ${warningReasonText}. ${notes ? `Note: ${notes}` : ''} Please ensure all communications follow our community guidelines.`,
      },
    })

    return NextResponse.json({
      success: true,
      data: warning,
    })
  } catch (error) {
    console.error('POST /api/admin/messages/[threadId]/warn error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to issue warning' },
      { status: 500 }
    )
  }
}
