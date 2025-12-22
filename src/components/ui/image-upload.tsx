'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
// Button import removed - not used

interface ImageUploadProps {
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: string
  uploadEndpoint: string
  aspectRatio?: 'square' | '16:9' | 'free'
  circular?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 6,
  maxSize = 5 * 1024 * 1024,
  accept = 'image/png,image/jpeg,image/webp',
  uploadEndpoint,
  aspectRatio = 'free',
  circular = false,
  placeholder = 'Drop image here or click to upload',
  className,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize value to array for consistent handling
  const images = Array.isArray(value) ? value : value ? [value] : []
  const canAddMore = multiple ? images.length < maxFiles : images.length === 0

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File): Promise<string | null> => {
    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return null
    }

    // Validate file type
    const allowedTypes = accept.split(',').map(t => t.trim())
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled || !canAddMore) return

    setError(null)
    setIsUploading(true)

    const fileArray = Array.from(files)
    const filesToUpload = multiple
      ? fileArray.slice(0, maxFiles - images.length)
      : [fileArray[0]]

    const uploadedUrls: string[] = []

    for (const file of filesToUpload) {
      const url = await uploadFile(file)
      if (url) uploadedUrls.push(url)
    }

    setIsUploading(false)

    if (uploadedUrls.length > 0) {
      if (multiple) {
        onChange([...images, ...uploadedUrls])
      } else {
        onChange(uploadedUrls[0])
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, handleFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRemove = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index)
      onChange(newImages)
    } else {
      onChange('')
    }
  }

  const aspectRatioClass = {
    'square': 'aspect-square',
    '16:9': 'aspect-video',
    'free': '',
  }[aspectRatio]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload area */}
      {canAddMore && (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary hover:bg-primary/5',
            isDragging && 'border-primary bg-primary/10',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'cursor-wait',
            circular ? 'w-24 h-24 rounded-full p-0 flex items-center justify-center mx-auto' : ''
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="font-mono text-text-muted animate-pulse">
              Uploading...
            </div>
          ) : (
            <div className={cn('text-text-muted', circular && 'text-xs')}>
              {circular ? '+' : placeholder}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className={cn(
          multiple ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : '',
          circular && !multiple ? 'flex justify-center' : ''
        )}>
          {images.map((url, index) => (
            <div
              key={url}
              className={cn(
                'relative group',
                circular ? 'w-24 h-24' : aspectRatioClass,
                !aspectRatioClass && !circular && 'h-32'
              )}
            >
              <div className={cn(
                'relative w-full h-full overflow-hidden bg-bg-dark',
                circular ? 'rounded-full' : 'rounded-lg'
              )}>
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={cn(
                  'absolute bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:bg-red-700',
                  circular ? '-top-1 -right-1' : 'top-1 right-1'
                )}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File count for multiple */}
      {multiple && (
        <p className="text-xs text-text-muted">
          {images.length}/{maxFiles} images
        </p>
      )}
    </div>
  )
}
