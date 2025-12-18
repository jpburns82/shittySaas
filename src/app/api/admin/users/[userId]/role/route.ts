import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/users/[userId]/role - Toggle admin status
export async function PATCH(
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
    const { isAdmin } = body

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isAdmin must be a boolean' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isAdmin: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent removing own admin status
    if (userId === session.user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove your own admin status' },
        { status: 400 }
      )
    }

    // Update admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'user.admin_changed',
        entityType: 'user',
        entityId: userId,
        actorId: session.user.id,
        metadata: {
          username: user.username,
          previousValue: user.isAdmin,
          newValue: isAdmin,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('PATCH /api/admin/users/[userId]/role error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update admin status' },
      { status: 500 }
    )
  }
}
