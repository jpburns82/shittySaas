import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateListingSchema } from '@/lib/validations'
import { deleteFile, getKeyFromUrl } from '@/lib/r2'

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
      select: { sellerId: true, thumbnailUrl: true, screenshots: true },
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

    // Clean up removed images from R2
    const newData = validation.data

    // Delete old thumbnail if it changed and was an R2 URL
    if (
      newData.thumbnailUrl !== undefined &&
      listing.thumbnailUrl &&
      listing.thumbnailUrl !== newData.thumbnailUrl &&
      listing.thumbnailUrl.includes('r2.dev')
    ) {
      try {
        const key = getKeyFromUrl(listing.thumbnailUrl)
        await deleteFile(key)
      } catch (err) {
        console.error('Failed to delete old thumbnail:', err)
      }
    }

    // Delete removed screenshots from R2
    if (newData.screenshots !== undefined) {
      const removedScreenshots = listing.screenshots.filter(
        (url) => !newData.screenshots?.includes(url) && url.includes('r2.dev')
      )
      for (const url of removedScreenshots) {
        try {
          const key = getKeyFromUrl(url)
          await deleteFile(key)
        } catch (err) {
          console.error('Failed to delete screenshot:', err)
        }
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: newData,
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

// Helper function to cleanup all R2 files for a listing
async function cleanupListingFiles(listing: {
  thumbnailUrl: string | null
  screenshots: string[]
  files: { fileKey: string }[]
}) {
  // Clean up thumbnail
  if (listing.thumbnailUrl?.includes('r2.dev')) {
    try {
      const key = getKeyFromUrl(listing.thumbnailUrl)
      await deleteFile(key)
    } catch (err) {
      console.error('Failed to delete thumbnail:', err)
    }
  }

  // Clean up screenshots
  for (const url of listing.screenshots) {
    if (url.includes('r2.dev')) {
      try {
        const key = getKeyFromUrl(url)
        await deleteFile(key)
      } catch (err) {
        console.error('Failed to delete screenshot:', err)
      }
    }
  }

  // Clean up listing files (downloads)
  for (const file of listing.files) {
    try {
      await deleteFile(file.fileKey)
    } catch (err) {
      console.error('Failed to delete file:', file.fileKey, err)
    }
  }
}

// DELETE /api/listings/[id] - Delete or soft-delete a listing
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

    // Fetch listing with files and purchases for business logic
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        files: { select: { fileKey: true } },
        purchases: {
          where: { status: { in: ['PENDING', 'COMPLETED'] } },
          select: { status: true }
        }
      }
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

    // Business logic: check for pending and completed purchases
    const hasPendingPurchases = listing.purchases.some(p => p.status === 'PENDING')
    const hasCompletedPurchases = listing.purchases.some(p => p.status === 'COMPLETED')

    // Block deletion if there are pending purchases
    if (hasPendingPurchases) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete listing with pending purchases. Complete or cancel the sale first.'
        },
        { status: 400 }
      )
    }

    // Soft delete if there are completed purchases (buyers keep access)
    if (hasCompletedPurchases) {
      await prisma.listing.update({
        where: { id },
        data: { deletedAt: new Date() }
      })

      return NextResponse.json({
        success: true,
        data: {
          softDeleted: true,
          message: 'Listing delisted. Existing buyers can still access their purchases.'
        },
      })
    }

    // Hard delete: no purchases, clean up everything
    await cleanupListingFiles(listing)
    await prisma.listing.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: {
        deleted: true,
        message: 'Listing permanently deleted.'
      },
    })
  } catch (error) {
    console.error('DELETE /api/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
