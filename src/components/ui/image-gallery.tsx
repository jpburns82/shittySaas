'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, handlePrev, handleNext])

  if (images.length === 0) return null

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {/* Main image */}
        <div
          className="relative aspect-video bg-bg-grave border border-border-dark cursor-pointer overflow-hidden"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={images[selectedIndex]}
            alt={`${alt} - Image ${selectedIndex + 1}`}
            fill
            className="object-contain"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <span className="text-white text-sm font-mono">Click to enlarge</span>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((url, index) => (
              <button
                key={url}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-20 h-14 flex-shrink-0 border-2 overflow-hidden transition-colors',
                  index === selectedIndex
                    ? 'border-primary'
                    : 'border-border-dark hover:border-border-light'
                )}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <p className="text-xs text-text-muted text-center">
            {selectedIndex + 1} / {images.length}
          </p>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            onClick={() => setIsLightboxOpen(false)}
          >
            ×
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 z-10 px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`${alt} - Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-mono">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
