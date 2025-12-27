import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/messages/[messageId] - Soft delete a message for the current user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { messageId } = await params

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        deletedBySender: true,
        deletedByReceiver: true,
      },
    })

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user is sender or receiver
    const isSender = message.senderId === session.user.id
    const isReceiver = message.receiverId === session.user.id

    if (!isSender && !isReceiver) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Soft delete for the current user
    await prisma.message.update({
      where: { id: messageId },
      data: isSender
        ? { deletedBySender: true }
        : { deletedByReceiver: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Message deleted',
    })
  } catch (error) {
    console.error('DELETE /api/messages/[messageId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
