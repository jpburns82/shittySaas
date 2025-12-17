import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/messages/[threadId]/unsuspend - Unsuspend a thread
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

    // Check if actually suspended
    if (existingThread.status !== 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'Thread is not suspended' },
        { status: 400 }
      )
    }

    // Unsuspend the thread
    const thread = await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspendedBy: null,
        suspendReason: null,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'thread.unsuspended',
        entityType: 'messageThread',
        entityId: threadId,
        actorId: session.user.id,
        metadata: {},
      },
    })

    // Send a system message to notify participants
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: existingThread.buyerId,
        threadId,
        listingId: existingThread.listingId,
        content: '🔓 This conversation has been unsuspended. You may now continue messaging.',
      },
    })

    return NextResponse.json({
      success: true,
      data: thread,
    })
  } catch (error) {
    console.error('POST /api/admin/messages/[threadId]/unsuspend error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unsuspend thread' },
      { status: 500 }
    )
  }
}
