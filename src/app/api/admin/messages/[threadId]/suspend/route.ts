import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/messages/[threadId]/suspend - Suspend a thread
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
    const { reason } = body

    // Verify thread exists
    const existingThread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    })

    if (!existingThread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Check if already suspended
    if (existingThread.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'Thread is already suspended' },
        { status: 400 }
      )
    }

    // Suspend the thread
    const thread = await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy: session.user.id,
        suspendReason: reason || null,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'thread.suspended',
        entityType: 'messageThread',
        entityId: threadId,
        actorId: session.user.id,
        metadata: {
          reason: reason || null,
        },
      },
    })

    // Send a system message to notify participants
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: existingThread.buyerId,
        threadId,
        listingId: existingThread.listingId,
        content: '🔒 This conversation has been suspended by a moderator. Neither party can send new messages until the suspension is lifted. If you believe this was a mistake, please contact support.',
      },
    })

    return NextResponse.json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('POST /api/admin/messages/[threadId]/suspend error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to suspend thread' },
      { status: 500 }
    )
  }
}
