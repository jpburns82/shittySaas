import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/users/[userId]/block - Block a user
export async function POST(
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

    const { userId } = await params

    // Prevent blocking yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot block yourself' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToBlock) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId,
        },
      },
    })

    if (existingBlock) {
      return NextResponse.json(
        { success: false, error: 'User is already blocked' },
        { status: 400 }
      )
    }

    // Create block
    await prisma.blockedUser.create({
      data: {
        blockerId: session.user.id,
        blockedId: userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User blocked',
    })
  } catch (error) {
    console.error('POST /api/users/[userId]/block error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to block user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[userId]/block - Unblock a user
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

    const { userId } = await params

    // Delete block if exists
    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedId: userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User unblocked',
    })
  } catch (error) {
    console.error('DELETE /api/users/[userId]/block error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unblock user' },
      { status: 500 }
    )
  }
}
