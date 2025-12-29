import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'
import { incrementDownloadCount } from '@/lib/download-limiter'
import { verifyDownloadToken } from '@/lib/download-token'

interface RouteContext {
  params: Promise<{ purchaseId: string; fileId: string }>
}

// GET /api/downloads/[purchaseId]/[fileId] - Get download URL for a file
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { purchaseId, fileId } = await context.params
    const session = await auth()

    // Check for guest JWT token in query params
    const token = request.nextUrl.searchParams.get('token')
    let guestEmailFromToken: string | null = null

    if (token) {
      const payload = verifyDownloadToken(token)
      if (payload && payload.purchaseId === purchaseId) {
        guestEmailFromToken = payload.email
      }
    }

    // Require either valid session OR valid guest token
    if (!session && !guestEmailFromToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Verify user owns this purchase (check buyer ID, session email, or guest token email)
    const isOwner = session && purchase.buyerId === session.user.id
    const isGuestOwnerBySession = session && purchase.guestEmail && purchase.guestEmail === session.user.email
    const isGuestOwnerByToken = guestEmailFromToken && purchase.guestEmail === guestEmailFromToken

    if (!isOwner && !isGuestOwnerBySession && !isGuestOwnerByToken) {
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
