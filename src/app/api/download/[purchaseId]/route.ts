import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

interface RouteParams {
  params: Promise<{ purchaseId: string }>
}

// GET /api/download/[purchaseId] - Get signed download URL for purchased files
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { purchaseId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to download files' },
        { status: 401 }
      )
    }

    // Get purchase with listing files
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        listing: {
          include: {
            files: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify buyer owns this purchase
    if (purchase.buyerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to download these files' },
        { status: 403 }
      )
    }

    // Verify purchase is completed
    if (purchase.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Purchase is not completed' },
        { status: 400 }
      )
    }

    // Get listing files
    const files = purchase.listing.files

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files available for download' },
        { status: 404 }
      )
    }

    // Generate signed URLs for all files (24 hour expiration)
    const downloadUrls = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        url: await getPresignedDownloadUrl(file.fileKey, 24 * 60 * 60), // 24 hours
      }))
    )

    return NextResponse.json({
      success: true,
      data: {
        listingTitle: purchase.listing.title,
        files: downloadUrls,
      },
    })
  } catch (error) {
    console.error('GET /api/download/[purchaseId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate download links' },
      { status: 500 }
    )
  }
}
