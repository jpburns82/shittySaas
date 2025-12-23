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

export async function incrementDownloadCount(purchaseId: string): Promise<void> {
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { downloadCount: { increment: 1 } },
  })
}
