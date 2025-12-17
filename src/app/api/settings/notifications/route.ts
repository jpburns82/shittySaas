import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const notificationSettingsSchema = z.object({
  messageNotifications: z.enum(['instant', 'digest', 'off']),
})

// GET /api/settings/notifications - Get current notification settings
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        messageNotifications: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageNotifications: user.messageNotifications,
      },
    })
  } catch (error) {
    console.error('GET /api/settings/notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/notifications - Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = notificationSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { messageNotifications } = validation.data

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { messageNotifications },
      select: {
        messageNotifications: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        messageNotifications: user.messageNotifications,
      },
    })
  } catch (error) {
    console.error('PATCH /api/settings/notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
