'use client'

import { useState, useRef } from 'react'
import { Button } from '../ui/button'
import type { ListingFile } from '@prisma/client'

interface FileUploadProps {
  listingId: string
  files: ListingFile[]
  onFilesChange: (files: ListingFile[]) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return '📦'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('text')) return '📝'
  return '📎'
}

export function FileUpload({ listingId, files, onFilesChange }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setError(null)
    setIsUploading(true)

    try {
      for (const file of selectedFiles) {
        // Validate size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name}: File too large (max 50MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`/api/listings/${listingId}/files`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Upload failed')
          continue
        }

        const data = await res.json()
        onFilesChange([...files, data.data])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId)
    setError(null)

    try {
      const res = await fetch(`/api/listings/${listingId}/files?fileId=${fileId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Delete failed')
        return
      }

      onFilesChange(files.filter((f) => f.id !== fileId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Error message */}
      {error && (
        <div className="p-2 bg-accent-red/10 border border-accent-red text-accent-red text-sm">
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-bg-secondary border border-border-dark"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                <div className="min-w-0">
                  <p className="text-sm truncate">{file.fileName}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(file.fileSize)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                disabled={deletingId === file.id}
                className="text-xs text-accent-red hover:underline disabled:opacity-50"
              >
                {deletingId === file.id ? '...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".zip,.rar,.7z,.tar,.gz,.tar.gz,.pdf,.txt,.md"
          multiple
        />
        <Button
          type="button"
          variant="default"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : '+ Add File'}
        </Button>
      </div>

      {files.length === 0 && (
        <p className="text-xs text-text-muted">
          No files uploaded yet. Add at least one file for instant download.
        </p>
      )}
    </div>
  )
}
