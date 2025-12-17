import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatFileSize, formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ purchaseId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { purchaseId } = await params
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { listing: { select: { title: true } } },
  })

  if (!purchase) return { title: 'Download Not Found' }

  return {
    title: `Download - ${purchase.listing.title}`,
  }
}

export default async function DownloadPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/login?redirect=/download/' + (await params).purchaseId)
  }

  const { purchaseId } = await params

  // Get purchase with listing files
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          deliveryMethod: true,
          files: {
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      },
      seller: { select: { username: true, displayName: true } },
    },
  })

  // Check if purchase exists
  if (!purchase) {
    notFound()
  }

  // Check if user owns this purchase
  if (purchase.buyerId !== session.user.id) {
    return (
      <div className="container py-8">
        <div className="card text-center py-12">
          <h1 className="font-display text-2xl mb-4 text-accent-red">Access Denied</h1>
          <p className="text-text-muted mb-6">
            You don&apos;t have access to download these files.
          </p>
          <Link href="/dashboard/purchases" className="btn btn-primary">
            View Your Purchases
          </Link>
        </div>
      </div>
    )
  }

  // Check if purchase is completed
  if (purchase.status !== 'COMPLETED') {
    return (
      <div className="container py-8">
        <div className="card text-center py-12">
          <h1 className="font-display text-2xl mb-4 text-accent-yellow">Payment Pending</h1>
          <p className="text-text-muted mb-6">
            Your payment is still being processed. Files will be available once payment is confirmed.
          </p>
          <Link href="/dashboard/purchases" className="btn">
            View Purchase Status
          </Link>
        </div>
      </div>
    )
  }

  // Check delivery status
  const isDelivered =
    purchase.deliveryStatus === 'CONFIRMED' ||
    purchase.deliveryStatus === 'AUTO_COMPLETED' ||
    purchase.deliveryStatus === 'DELIVERED'

  if (!isDelivered && purchase.listing.deliveryMethod !== 'INSTANT_DOWNLOAD') {
    return (
      <div className="container py-8">
        <div className="card text-center py-12">
          <h1 className="font-display text-2xl mb-4">Awaiting Delivery</h1>
          <p className="text-text-muted mb-6">
            The seller hasn&apos;t delivered the files yet. You&apos;ll receive an email when they&apos;re ready.
          </p>
          <Link href="/dashboard/purchases" className="btn">
            View Purchase Status
          </Link>
        </div>
      </div>
    )
  }

  const files = purchase.listing.files

  return (
    <div className="container py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/purchases" className="text-link text-sm mb-2 inline-block">
          ← Back to Purchases
        </Link>
        <h1 className="font-display text-2xl">{purchase.listing.title}</h1>
        <p className="text-text-muted">
          Purchased from @{purchase.seller.username} on {formatDate(purchase.createdAt)}
        </p>
      </div>

      {/* Files */}
      <div className="card">
        <h2 className="font-display text-lg mb-4">Download Files</h2>

        {files.length === 0 ? (
          <p className="text-text-muted">
            No downloadable files available for this listing.
          </p>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-bg-primary border border-border-light"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getFileIcon(file.mimeType || '')}
                  </span>
                  <div>
                    <div className="font-medium">{file.fileName}</div>
                    <div className="text-sm text-text-muted">
                      {formatFileSize(file.fileSize)}
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/downloads/${purchaseId}/${file.id}`}
                  className="btn btn-primary"
                  download
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support info */}
      <div className="mt-6 text-sm text-text-muted">
        <p>
          Having trouble with your download?{' '}
          <Link href={`/dashboard/messages?to=${purchase.seller.username}`} className="text-link">
            Contact the seller
          </Link>
        </p>
      </div>
    </div>
  )
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return '📦'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('video')) return '🎬'
  if (mimeType.includes('audio')) return '🎵'
  return '📁'
}
