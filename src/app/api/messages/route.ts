import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMessageSchema } from '@/lib/validations'
import { sendMessageNotificationEmail } from '@/lib/email'

// GET /api/messages - Get messages/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('userId')
    const listingId = searchParams.get('listingId')

    if (otherUserId) {
      // Get conversation with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: session.user.id },
          ],
          ...(listingId ? { listingId } : {}),
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
          listing: { select: { id: true, title: true, slug: true } },
          attachments: true,
        },
      })

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          receiverId: session.user.id,
          senderId: otherUserId,
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        data: messages,
      })
    }

    // Get all conversations (grouped)
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        listing: { select: { id: true, title: true, slug: true } },
        attachments: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
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
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { receiverId, content, listingId, attachments } = validation.data

    // Prevent messaging yourself
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Check if blocked
    const blockExists = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: receiverId },
          { blockerId: receiverId, blockedId: session.user.id },
        ],
      },
    })

    if (blockExists) {
      return NextResponse.json(
        { success: false, error: 'Cannot send message to this user' },
        { status: 403 }
      )
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, email: true, username: true, messageNotifications: true },
    })

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Find or create thread
    // For threads, we need to determine buyer/seller. When someone contacts about a listing,
    // the sender is typically the buyer (potential purchaser) and receiver is the seller.
    // For non-listing conversations, use alphabetical ordering of IDs for consistency.
    const isSenderBuyer = listingId
      ? true // Person contacting about a listing is the buyer
      : session.user.id < receiverId // Consistent ordering for non-listing threads

    let thread = await prisma.messageThread.findFirst({
      where: {
        OR: [
          { buyerId: session.user.id, sellerId: receiverId, listingId: listingId || null },
          { buyerId: receiverId, sellerId: session.user.id, listingId: listingId || null },
        ],
      },
    })

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          buyerId: isSenderBuyer ? session.user.id : receiverId,
          sellerId: isSenderBuyer ? receiverId : session.user.id,
          listingId: listingId || null,
        },
      })
    }

    // Check if thread is suspended
    if (thread.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'This conversation has been suspended by a moderator' },
        { status: 403 }
      )
    }

    // Create message with attachments (linked to thread)
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        listingId: listingId || null,
        threadId: thread.id,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att) => ({
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileKey: att.key,
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true, isAdmin: true } },
        listing: { select: { id: true, title: true, slug: true } },
        attachments: true,
      },
    })

    // Send email notification if user wants instant notifications
    if (receiver.email && receiver.messageNotifications === 'instant') {
      const attachmentCount = attachments?.length || 0
      await sendMessageNotificationEmail(
        receiver.email,
        session.user.username || 'Someone',
        attachmentCount > 0 ? ` (${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''})` : ''
      )
    }

    return NextResponse.json({
      success: true,
      data: message,
    })
  } catch (error) {
    console.error('POST /api/messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
