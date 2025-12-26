import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'

interface Props {
  searchParams: Promise<{ session_id?: string; purchaseId?: string }>
}

export const metadata = {
  title: 'Purchase Complete',
}

export default async function PurchaseSuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const { purchaseId } = params

  if (!purchaseId) {
    redirect('/')
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      listing: {
        select: { title: true, slug: true, deliveryMethod: true }
      }
    }
  })

  if (!purchase) {
    redirect('/')
  }

  const session = await auth()
  const isInstantDownload = purchase.listing.deliveryMethod === 'INSTANT_DOWNLOAD'

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-secondary border border-border-crypt rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-display text-white mb-2">Purchase Complete!</h1>
        <p className="text-text-secondary mb-6">
          Thank you for purchasing <span className="text-accent-cyan">{purchase.listing.title}</span>
        </p>

        {isInstantDownload ? (
          <div className="space-y-4">
            {purchase.guestEmail ? (
              <>
                <p className="text-text-secondary">
                  A download link has been sent to:
                </p>
                <p className="text-white font-medium">{purchase.guestEmail}</p>
                <p className="text-sm text-text-muted">
                  Check your inbox (and spam folder) for the download link.
                  Link expires in 7 days.
                </p>
              </>
            ) : session?.user ? (
              <Link
                href={`/download/${purchase.id}`}
                className="inline-block w-full py-3 px-4 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
              >
                Download Now
              </Link>
            ) : (
              <>
                <p className="text-text-secondary">
                  Your download is ready!
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full py-3 px-4 bg-accent-cyan text-black font-bold rounded-lg hover:bg-accent-cyan/90 transition-colors"
                >
                  Login to Download
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-text-secondary">
              The seller will contact you to complete the delivery.
            </p>
            <p className="text-sm text-text-muted">
              Delivery method: {purchase.listing.deliveryMethod.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border-crypt">
          <Link href="/" className="text-accent-cyan hover:underline">
            ← Back to UndeadList
          </Link>
        </div>
      </div>
    </div>
  )
}
