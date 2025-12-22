'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { MessageAttachment } from '@prisma/client'
import { Modal } from '../ui/modal'

interface AttachmentDisplayProps {
  attachments: MessageAttachment[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('document') || mimeType === 'text/plain') return '📝'
  return '📎'
}

function isImageType(mimeType: string | null): boolean {
  return mimeType?.startsWith('image/') || false
}

export function AttachmentDisplay({ attachments }: AttachmentDisplayProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) return null

  const handleDownload = async (attachment: MessageAttachment) => {
    setDownloading(attachment.id)
    try {
      // Get presigned download URL
      const res = await fetch(`/api/messages/attachments/${attachment.id}/download`)
      if (res.ok) {
        const data = await res.json()
        // Create a temporary link to download with original filename
        const link = document.createElement('a')
        link.href = data.url
        link.download = attachment.fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <>
      <div className="mt-2 space-y-2">
        {attachments.map((attachment) => {
          const isImage = isImageType(attachment.mimeType)
          const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${attachment.fileKey}`

          return (
            <div
              key={attachment.id}
              className="border border-border-dark bg-bg-primary p-2"
            >
              {isImage ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setLightboxImage(publicUrl)}
                    className="block w-full cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={publicUrl}
                      alt={attachment.fileName}
                      width={400}
                      height={200}
                      className="max-w-full max-h-[200px] object-contain mx-auto"
                      unoptimized
                    />
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted truncate flex-1">
                      {attachment.fileName}
                    </span>
                    <button
                      onClick={() => handleDownload(attachment)}
                      disabled={downloading === attachment.id}
                      className="btn-link text-xs ml-2"
                    >
                      {downloading === attachment.id ? 'Loading...' : 'Download'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{attachment.fileName}</p>
                      <p className="text-xs text-text-muted">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(attachment)}
                    disabled={downloading === attachment.id}
                    className="btn-secondary text-xs px-2 py-1 whitespace-nowrap"
                  >
                    {downloading === attachment.id ? '...' : 'Download'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Image Lightbox Modal */}
      <Modal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        size="lg"
      >
        {lightboxImage && (
          <Image
            src={lightboxImage}
            alt="Full size image"
            width={1200}
            height={800}
            className="max-w-full max-h-[80vh] object-contain mx-auto"
            unoptimized
          />
        )}
      </Modal>
    </>
  )
}
