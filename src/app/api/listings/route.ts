import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createListingSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const search = searchParams.get('q')
    const sort = searchParams.get('sort') || 'newest'
    const priceType = searchParams.get('priceType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      deletedAt: null,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { techStack: { has: search } },
      ]
    }

    if (priceType) {
      where.priceType = priceType
    }

    if (minPrice || maxPrice) {
      where.priceInCents = {}
      if (minPrice) (where.priceInCents as Record<string, number>).gte = parseInt(minPrice) * 100
      if (maxPrice) (where.priceInCents as Record<string, number>).lte = parseInt(maxPrice) * 100
    }

    const orderBy: Record<string, string> = {}
    switch (sort) {
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
      case 'price-low':
        orderBy.priceInCents = 'asc'
        break
      case 'price-high':
        orderBy.priceInCents = 'desc'
        break
      case 'popular':
        orderBy.viewCount = 'desc'
        break
      default:
        orderBy.createdAt = 'desc'
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { username: true, displayName: true, avatarUrl: true } },
          category: { select: { name: true, slug: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/listings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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

    const body = await request.json()
    const validation = createListingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Generate unique slug
    let slug = slugify(data.title)
    const existing = await prisma.listing.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const listing = await prisma.listing.create({
      data: {
        ...data,
        slug,
        sellerId: session.user.id,
        status: 'DRAFT', // Start as draft, seller publishes when ready
      },
    })

    return NextResponse.json({
      success: true,
      data: listing,
    })
  } catch (error) {
    console.error('POST /api/listings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
