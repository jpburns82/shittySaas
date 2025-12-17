'use client'

export interface PendingAttachment {
  id: string
  file: File
  progress: number
  uploaded: boolean
  error?: string
  key?: string
  url?: string
}

interface AttachmentPreviewProps {
  attachments: PendingAttachment[]
  onRemove: (id: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('document') || mimeType === 'text/plain') return '📝'
  return '📎'
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className="space-y-2 mb-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`
            border p-2 flex items-center gap-2
            ${attachment.error
              ? 'border-accent-red bg-red-50'
              : attachment.uploaded
                ? 'border-accent-green bg-green-50'
                : 'border-border-dark bg-bg-secondary'
            }
          `}
        >
          <span className="text-lg">{getFileIcon(attachment.file.type)}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm truncate">{attachment.file.name}</span>
              {attachment.uploaded && <span className="text-accent-green">✓</span>}
            </div>

            {attachment.error ? (
              <p className="text-xs text-accent-red">{attachment.error}</p>
            ) : attachment.uploaded ? (
              <p className="text-xs text-text-muted">
                {formatFileSize(attachment.file.size)}
              </p>
            ) : (
              <div className="mt-1">
                <div className="h-1 bg-border-dark overflow-hidden">
                  <div
                    className="h-full bg-accent-blue transition-all duration-300"
                    style={{ width: `${attachment.progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {attachment.progress}%
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="p-1 hover:bg-bg-accent text-text-muted hover:text-accent-red"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
