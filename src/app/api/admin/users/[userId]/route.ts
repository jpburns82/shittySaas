import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[userId] - Get user details
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        websiteUrl: true,
        twitterHandle: true,
        githubHandle: true,
        isAdmin: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        deletedAt: true,
        stripeOnboarded: true,
        stripePayoutsEnabled: true,
        isVerifiedSeller: true,
        verifiedAt: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            listings: true,
            purchases: { where: { status: 'COMPLETED' } },
            sales: { where: { status: 'COMPLETED' } },
            warnings: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get recent warnings
    const warnings = await prisma.userWarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reason: true,
        notes: true,
        createdAt: true,
        thread: {
          select: { id: true },
        },
      },
    })

    // Get reports against this user
    const reportsAgainst = await prisma.report.count({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        warnings,
        reportsAgainst,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users/[userId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
