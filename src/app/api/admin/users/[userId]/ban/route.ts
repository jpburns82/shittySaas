import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[userId]/ban - Ban user
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
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ban reason is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is not already banned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isBanned: true, isAdmin: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent banning admins
    if (user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cannot ban admin users' },
        { status: 400 }
      )
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: 'User is already banned' },
        { status: 400 }
      )
    }

    // Ban the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
      },
      select: {
        id: true,
        username: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'user.banned',
        entityType: 'user',
        entityId: userId,
        actorId: session.user.id,
        metadata: {
          reason,
          username: user.username,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('POST /api/admin/users/[userId]/ban error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ban user' },
      { status: 500 }
    )
  }
}
