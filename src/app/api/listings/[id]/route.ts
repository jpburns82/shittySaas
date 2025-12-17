import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateListingSchema } from '@/lib/validations'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/listings/[id] - Get a single listing
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            _count: { select: { listings: true, sales: true } },
          },
        },
        category: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { username: true, displayName: true, avatarUrl: true } },
          },
        },
        _count: { select: { votes: true, comments: true } },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: listing,
    })
  } catch (error) {
    console.error('GET /api/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

// PUT /api/listings/[id] - Update a listing
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateListingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('PUT /api/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id] - Delete a listing
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.listing.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('DELETE /api/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
