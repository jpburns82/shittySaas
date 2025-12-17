import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { attachmentId } = await params

    // Get attachment with message info
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            senderId: true,
            receiverId: true,
          },
        },
      },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Verify user is sender or receiver
    const isParticipant =
      attachment.message.senderId === session.user.id ||
      attachment.message.receiverId === session.user.id

    // Also allow admins
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!isParticipant && !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate presigned download URL (1 hour expiry)
    const url = await getPresignedDownloadUrl(attachment.fileKey, 3600)

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error('GET /api/messages/attachments/[id]/download error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get download URL' },
      { status: 500 }
    )
  }
}
