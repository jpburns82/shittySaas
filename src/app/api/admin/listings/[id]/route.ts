import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile, getKeyFromUrl } from '@/lib/r2'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/listings/[id] - Update listing status (admin)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED', 'REMOVED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        status,
        ...(status === 'ACTIVE' ? { publishedAt: new Date() } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      data: listing,
    })
  } catch (error) {
    console.error('PATCH /api/admin/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/listings/[id] - Delete listing (admin)
// Use ?force=true to delete listings with purchases
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    // Fetch listing with files and purchase count
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        files: { select: { fileKey: true } },
        _count: { select: { purchases: { where: { status: 'COMPLETED' } } } }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Warn about purchases unless force=true
    if (listing._count.purchases > 0 && !forceDelete) {
      return NextResponse.json({
        success: false,
        error: 'Listing has purchases. Use force=true to delete anyway.',
        data: { purchaseCount: listing._count.purchases }
      }, { status: 400 })
    }

    // Clean up R2 files before deletion
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

    await prisma.listing.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('DELETE /api/admin/listings/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
