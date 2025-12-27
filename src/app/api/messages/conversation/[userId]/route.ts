import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/messages/conversation/[userId] - Soft delete all messages in a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId: otherUserId } = await params
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    // Update messages where current user is sender
    await prisma.message.updateMany({
      where: {
        senderId: session.user.id,
        receiverId: otherUserId,
        ...(listingId ? { listingId } : {}),
      },
      data: { deletedBySender: true },
    })

    // Update messages where current user is receiver
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        ...(listingId ? { listingId } : {}),
      },
      data: { deletedByReceiver: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    })
  } catch (error) {
    console.error('DELETE /api/messages/conversation/[userId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
