import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BackPageCategory, Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  BACKPAGE_LIMITS,
  VALID_CATEGORIES,
  getNextMonday,
  generateSlug,
} from '@/lib/backpage'

// ===========================================
// GET /api/backpage - List posts (Public)
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = BACKPAGE_LIMITS.POSTS_PER_PAGE

    // Build where clause
    const where: Prisma.BackPagePostWhereInput = {
      expiresAt: { gt: new Date() }, // Only non-expired posts
      status: 'ACTIVE', // Only active (not removed) posts
    }

    if (category && category !== 'ALL' && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      where.category = category as BackPageCategory
    }

    // Fetch posts and total count
    const [posts, total] = await Promise.all([
      prisma.backPagePost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              sellerTier: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.backPagePost.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('GET /api/backpage error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST /api/backpage - Create post (Auth required)
// ===========================================

const createPostSchema = z.object({
  title: z
    .string()
    .min(BACKPAGE_LIMITS.TITLE_MIN, `Title must be at least ${BACKPAGE_LIMITS.TITLE_MIN} characters`)
    .max(BACKPAGE_LIMITS.TITLE_MAX, `Title must be at most ${BACKPAGE_LIMITS.TITLE_MAX} characters`),
  content: z
    .string()
    .min(BACKPAGE_LIMITS.BODY_MIN, `Content must be at least ${BACKPAGE_LIMITS.BODY_MIN} characters`)
    .max(BACKPAGE_LIMITS.BODY_MAX, `Content must be at most ${BACKPAGE_LIMITS.BODY_MAX} characters`),
  category: z.enum(VALID_CATEGORIES),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true, deletedAt: true },
    })

    if (user?.isBanned || user?.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Your account is not active' },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { title, content, category } = validation.data

    // Check 1 post per day limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentPost = await prisma.backPagePost.findFirst({
      where: {
        authorId: session.user.id,
        createdAt: { gte: oneDayAgo },
      },
    })

    if (recentPost) {
      return NextResponse.json(
        { success: false, error: 'You can only post once per day' },
        { status: 429 }
      )
    }

    // Create the post
    const post = await prisma.backPagePost.create({
      data: {
        title,
        body: content,
        slug: generateSlug(title),
        category,
        authorId: session.user.id,
        expiresAt: getNextMonday(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            sellerTier: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/backpage error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
