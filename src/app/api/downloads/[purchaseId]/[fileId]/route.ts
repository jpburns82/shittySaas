import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'
import { incrementDownloadCount } from '@/lib/download-limiter'

interface RouteContext {
  params: Promise<{ purchaseId: string; fileId: string }>
}

// GET /api/downloads/[purchaseId]/[fileId] - Get download URL for a file
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { purchaseId, fileId } = await context.params

    // Get purchase and verify ownership
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        listing: {
          select: {
            id: true,
            deliveryMethod: true,
            files: {
              where: { id: fileId },
              select: {
                id: true,
                fileName: true,
                fileKey: true,
                mimeType: true,
              },
            },
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

    // Verify user owns this purchase (check both regular buyer and guest email)
    const isOwner = purchase.buyerId === session.user.id
    const isGuestOwner = purchase.guestEmail && purchase.guestEmail === session.user.email

    if (!isOwner && !isGuestOwner) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check purchase status
    if (purchase.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 403 }
      )
    }

    // Check delivery status for non-instant downloads
    const isDelivered =
      purchase.deliveryStatus === 'CONFIRMED' ||
      purchase.deliveryStatus === 'AUTO_COMPLETED' ||
      purchase.deliveryStatus === 'DELIVERED'

    if (!isDelivered && purchase.listing.deliveryMethod !== 'INSTANT_DOWNLOAD') {
      return NextResponse.json(
        { success: false, error: 'Files not yet delivered' },
        { status: 403 }
      )
    }

    // Get file
    const file = purchase.listing.files[0]
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Check and increment download count
    const canDownload = await incrementDownloadCount(purchaseId)
    if (!canDownload) {
      return NextResponse.json(
        { success: false, error: 'Download limit exceeded. Contact seller for additional downloads.' },
        { status: 403 }
      )
    }

    // Generate presigned download URL (valid for 1 hour)
    const downloadUrl = await getPresignedDownloadUrl(file.fileKey, 3600)

    // Redirect to the presigned URL
    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('GET /api/downloads/[purchaseId]/[fileId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
