import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[userId]/warnings - Get user's warning history
export async function GET(
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

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const warnings = await prisma.userWarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        thread: {
          select: {
            id: true,
            listing: { select: { title: true } },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: warnings,
    })
  } catch (error) {
    console.error('GET /api/admin/users/[userId]/warnings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warnings' },
      { status: 500 }
    )
  }
}
