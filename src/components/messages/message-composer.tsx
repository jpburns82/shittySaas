'use client'

import { useState, useRef } from 'react'
import { Button } from '../ui/button'
import { AttachmentPreview, type PendingAttachment } from './attachment-preview'
import { MESSAGE_LIMITS } from '@/lib/constants'
import type { AttachmentInput } from '@/types/user'

interface MessageComposerProps {
  onSend: (content: string, attachments?: AttachmentInput[]) => Promise<void>
  placeholder?: string
  disabled?: boolean
  isBlocked?: boolean
  isAdmin?: boolean
  adminTemplates?: { label: string; content: string }[]
}

export function MessageComposer({
  onSend,
  placeholder = 'Write your reply...',
  disabled,
  isBlocked,
  isAdmin,
  adminTemplates,
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = attachments.some((a) => !a.uploaded && !a.error)
  const canSend = (content.trim() || attachments.some((a) => a.uploaded)) && !isUploading && !sending

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setError(null)

    // Check limits
    const currentCount = attachments.filter((a) => a.uploaded).length
    if (currentCount + files.length > MESSAGE_LIMITS.MAX_ATTACHMENTS) {
      setError(`Maximum ${MESSAGE_LIMITS.MAX_ATTACHMENTS} attachments allowed`)
      return
    }

    // Validate and add files
    const newAttachments: PendingAttachment[] = []

    for (const file of files) {
      // Check size
      if (file.size > MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE) {
        setError(`${file.name}: File too large (max 5MB)`)
        continue
      }

      // Check type
      if (!MESSAGE_LIMITS.ALLOWED_ATTACHMENT_TYPES.includes(file.type as typeof MESSAGE_LIMITS.ALLOWED_ATTACHMENT_TYPES[number])) {
        setError(`${file.name}: File type not allowed`)
        continue
      }

      const id = Math.random().toString(36).slice(2)
      newAttachments.push({
        id,
        file,
        progress: 0,
        uploaded: false,
      })
    }

    if (newAttachments.length === 0) return

    setAttachments((prev) => [...prev, ...newAttachments])

    // Upload files
    await uploadFiles(newAttachments)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFiles = async (filesToUpload: PendingAttachment[]) => {
    const formData = new FormData()
    filesToUpload.forEach((a) => formData.append('files', a.file))

    try {
      // Simulate progress (real progress would need XMLHttpRequest)
      for (const att of filesToUpload) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === att.id ? { ...a, progress: 30 } : a))
        )
      }

      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      })

      for (const att of filesToUpload) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === att.id ? { ...a, progress: 80 } : a))
        )
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      const uploadedFiles = data.data as Array<{
        key: string
        url: string
        fileName: string
        fileSize: number
        mimeType: string
      }>

      // Match uploaded files to pending attachments by filename
      setAttachments((prev) =>
        prev.map((att) => {
          if (!filesToUpload.find((f) => f.id === att.id)) return att

          const uploaded = uploadedFiles.find((u) => u.fileName === att.file.name)
          if (uploaded) {
            return {
              ...att,
              progress: 100,
              uploaded: true,
              key: uploaded.key,
              url: uploaded.url,
            }
          }
          return { ...att, error: 'Upload failed' }
        })
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setAttachments((prev) =>
        prev.map((att) =>
          filesToUpload.find((f) => f.id === att.id)
            ? { ...att, error: errorMessage }
            : att
        )
      )
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return

    setError(null)
    setSending(true)

    try {
      const uploadedAttachments: AttachmentInput[] = attachments
        .filter((a) => a.uploaded && a.key)
        .map((a) => ({
          key: a.key!,
          fileName: a.file.name,
          fileSize: a.file.size,
          mimeType: a.file.type,
        }))

      await onSend(content.trim(), uploadedAttachments.length > 0 ? uploadedAttachments : undefined)

      setContent('')
      setAttachments([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent)
  }

  if (isBlocked) {
    return (
      <div className="p-4 border-t border-border-dark bg-bg-secondary text-center">
        <p className="text-text-muted">You cannot reply to this user</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-dark bg-bg-primary">
      {/* Admin Templates */}
      {isAdmin && adminTemplates && adminTemplates.length > 0 && (
        <div className="p-2 border-b border-border-dark bg-bg-secondary">
          <label className="text-xs text-text-muted mr-2">Use template:</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleTemplateSelect(e.target.value)
                e.target.value = ''
              }
            }}
            className="text-xs py-1 px-2"
          >
            <option value="">-- Select --</option>
            {adminTemplates.map((t, i) => (
              <option key={i} value={t.content}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 bg-accent-red/10 border border-accent-red text-accent-red text-sm">
            {error}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={`w-full min-h-[100px] max-h-[300px] resize-y ${error ? 'border-accent-red' : ''}`}
          aria-label="Message content"
        />

        {/* Attachment Previews */}
        <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={MESSAGE_LIMITS.ALLOWED_ATTACHMENT_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="attachment-input"
            />
            <Button
              type="button"
              variant="default"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending || attachments.filter((a) => a.uploaded).length >= MESSAGE_LIMITS.MAX_ATTACHMENTS}
            >
              📎 Attach File
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!canSend || disabled}
            loading={sending}
          >
            Send Message
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-text-muted mt-2">
          {MESSAGE_LIMITS.MAX_ATTACHMENTS} files max · 5MB each · PDF, PNG, JPG, DOC · Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  )
}
