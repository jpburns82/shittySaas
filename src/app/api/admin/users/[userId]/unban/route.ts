import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[userId]/unban - Unban user
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

    // Verify user exists and is banned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isBanned: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isBanned) {
      return NextResponse.json(
        { success: false, error: 'User is not banned' },
        { status: 400 }
      )
    }

    // Unban the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        banReason: null,
      },
      select: {
        id: true,
        username: true,
        isBanned: true,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'user.unbanned',
        entityType: 'user',
        entityId: userId,
        actorId: session.user.id,
        metadata: {
          username: user.username,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('POST /api/admin/users/[userId]/unban error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unban user' },
      { status: 500 }
    )
  }
}
