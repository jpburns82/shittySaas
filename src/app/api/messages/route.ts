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
          sender: { select: { username: true, displayName: true, avatarUrl: true } },
          listing: { select: { id: true, title: true, slug: true } },
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
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, slug: true } },
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

    const { receiverId, content, listingId } = validation.data

    // Prevent messaging yourself
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, email: true, username: true },
    })

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        listingId: listingId || null,
      },
      include: {
        sender: { select: { username: true, displayName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
    })

    // Send email notification
    if (receiver.email) {
      await sendMessageNotificationEmail(
        receiver.email,
        session.user.username || 'Someone'
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
