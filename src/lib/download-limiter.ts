import { prisma } from '@/lib/prisma'

/**
 * Download limits per purchase:
 * - Default: 10 downloads per purchase
 * - Covers all files in the purchase combined
 */

export async function getDownloadStatus(purchaseId: string): Promise<{
  canDownload: boolean
  downloadCount: number
  maxDownloads: number
  remaining: number
} | null> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { downloadCount: true, maxDownloads: true },
  })

  if (!purchase) return null

  const remaining = purchase.maxDownloads - purchase.downloadCount

  return {
    canDownload: purchase.downloadCount < purchase.maxDownloads,
    downloadCount: purchase.downloadCount,
    maxDownloads: purchase.maxDownloads,
    remaining: Math.max(0, remaining),
  }
}

export async function canDownload(purchaseId: string): Promise<boolean> {
  const status = await getDownloadStatus(purchaseId)
  return status?.canDownload ?? false
}

/**
 * Atomically increment download count with limit check.
 * Uses transaction to prevent race conditions where concurrent requests
 * could exceed the download limit.
 * @returns true if increment succeeded, false if limit already reached
 */
export async function incrementDownloadCount(purchaseId: string): Promise<boolean> {
  try {
    // Use transaction with check to ensure atomic increment
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        select: { downloadCount: true, maxDownloads: true },
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      // Check limit inside transaction
      if (purchase.downloadCount >= purchase.maxDownloads) {
        return null // Limit reached
      }

      // Atomic increment
      return tx.purchase.update({
        where: { id: purchaseId },
        data: { downloadCount: { increment: 1 } },
      })
    })

    return result !== null
  } catch (error) {
    console.error('incrementDownloadCount error:', error)
    return false
  }
}
