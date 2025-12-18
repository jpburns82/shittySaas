import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/admin/users - Get all users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const role = searchParams.get('role') || 'all'
    const stripeConnected = searchParams.get('stripeConnected')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Prisma.UserWhereInput = {}

    // Search filter (name or email)
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Status filter
    if (status === 'active') {
      where.isBanned = false
      where.deletedAt = null
    } else if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'deleted') {
      where.deletedAt = { not: null }
    }

    // Role filter
    if (role === 'admin') {
      where.isAdmin = true
    } else if (role === 'seller') {
      where.stripeOnboarded = true
    } else if (role === 'buyer') {
      where.purchases = { some: { status: 'COMPLETED' } }
    }

    // Stripe connected filter
    if (stripeConnected === 'true') {
      where.stripeOnboarded = true
    } else if (stripeConnected === 'false') {
      where.stripeOnboarded = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isAdmin: true,
          isBanned: true,
          bannedAt: true,
          banReason: true,
          deletedAt: true,
          stripeOnboarded: true,
          createdAt: true,
          _count: {
            select: {
              listings: { where: { status: 'ACTIVE' } },
              sales: { where: { status: 'COMPLETED' } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
