import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/listings/[id]/feature - Feature or unfeature a listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, duration } = body as {
      action: 'feature' | 'unfeature'
      duration?: '7' | '14' | '30' | 'indefinite'
    }

    if (!action || !['feature', 'unfeature'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, title: true, featured: true, featuredUntil: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    let featuredUntil: Date | null = null

    if (action === 'feature') {
      if (duration && duration !== 'indefinite') {
        const days = parseInt(duration)
        featuredUntil = new Date()
        featuredUntil.setDate(featuredUntil.getDate() + days)
      }
      // If 'indefinite' or no duration, featuredUntil stays null

      const updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          featured: true,
          featuredUntil,
        },
        select: {
          id: true,
          title: true,
          featured: true,
          featuredUntil: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'listing.featured',
          entityType: 'listing',
          entityId: id,
          actorId: session.user.id,
          metadata: {
            title: listing.title,
            duration: duration || 'indefinite',
            featuredUntil: featuredUntil?.toISOString() || null,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: updatedListing,
      })
    } else {
      // Unfeature
      const updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          featured: false,
          featuredUntil: null,
        },
        select: {
          id: true,
          title: true,
          featured: true,
          featuredUntil: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          action: 'listing.unfeatured',
          entityType: 'listing',
          entityId: id,
          actorId: session.user.id,
          metadata: {
            title: listing.title,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: updatedListing,
      })
    }
  } catch (error) {
    console.error('POST /api/admin/listings/[id]/feature error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}
