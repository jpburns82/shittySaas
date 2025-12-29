import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail, sendGuestDownloadEmail } from '@/lib/email'
import { validateCSRF } from '@/lib/csrf'
import { generateDownloadUrl } from '@/lib/download-token'

// POST /api/purchases/claim - Claim a free listing
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfValid = await validateCSRF(request)
    if (!csrfValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid request. Please refresh and try again.' },
        { status: 403 }
      )
    }

    const session = await auth()
    const body = await request.json()
    const { listingId, guestEmail } = body

    if (!session && !guestEmail) {
      return NextResponse.json(
        { success: false, error: 'Must be logged in or provide email' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: { select: { id: true, email: true, username: true } },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is not available' },
        { status: 400 }
      )
    }

    // Must be a FREE listing
    if (listing.priceType !== 'FREE') {
      return NextResponse.json(
        { success: false, error: 'This listing is not free' },
        { status: 400 }
      )
    }

    // Prevent claiming own listing
    if (session?.user.id === listing.sellerId) {
      return NextResponse.json(
        { success: false, error: 'Cannot claim your own listing' },
        { status: 400 }
      )
    }

    // Check if already claimed (prevent duplicates)
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        listingId: listing.id,
        OR: [
          ...(session?.user.id ? [{ buyerId: session.user.id }] : []),
          ...(guestEmail ? [{ guestEmail: guestEmail }] : []),
        ],
        status: 'COMPLETED',
      },
    })

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'You have already claimed this listing' },
        { status: 400 }
      )
    }

    // Create completed purchase record
    const purchase = await prisma.purchase.create({
      data: {
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: session?.user.id || null,
        guestEmail: guestEmail || null,
        amountPaidCents: 0,
        platformFeeCents: 0,
        sellerAmountCents: 0,
        status: 'COMPLETED',
        deliveryStatus: listing.deliveryMethod === 'INSTANT_DOWNLOAD' ? 'AUTO_COMPLETED' : 'PENDING',
        escrowStatus: 'RELEASED',
        escrowReleasedAt: new Date(),
      },
    })

    // Send emails (wrapped in try-catch to not fail the request)
    const buyerEmail = session?.user.email || guestEmail
    if (buyerEmail) {
      try {
        // Generate download URL for instant downloads (guests get JWT-authenticated link)
        const downloadUrl = listing.deliveryMethod === 'INSTANT_DOWNLOAD' && guestEmail
          ? generateDownloadUrl(purchase.id, guestEmail)
          : listing.deliveryMethod === 'INSTANT_DOWNLOAD'
            ? `${process.env.NEXT_PUBLIC_APP_URL}/download/${purchase.id}`
            : undefined

        await sendPurchaseConfirmationEmail(buyerEmail, listing.title, 0, downloadUrl)
      } catch (e) {
        console.error('Failed to send purchase confirmation:', e)
      }
    }

    // Send guest download email for instant downloads
    if (guestEmail && listing.deliveryMethod === 'INSTANT_DOWNLOAD') {
      try {
        await sendGuestDownloadEmail(guestEmail, listing.title, purchase.id)
      } catch (e) {
        console.error('Failed to send guest download email:', e)
      }
    }

    if (listing.seller.email) {
      try {
        await sendSaleNotificationEmail(
          listing.seller.email,
          listing.title,
          0,
          session?.user.username || 'Guest'
        )
      } catch (e) {
        console.error('Failed to send sale notification:', e)
      }
    }

    return NextResponse.json({
      success: true,
      data: { purchaseId: purchase.id },
    })
  } catch (error) {
    console.error('POST /api/purchases/claim error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to claim listing' },
      { status: 500 }
    )
  }
}
