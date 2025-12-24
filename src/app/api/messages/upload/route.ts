import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile, generateFileKey, validateFile, sanitizeFilename } from '@/lib/r2'
import { MESSAGE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MESSAGE_LIMITS.MAX_ATTACHMENTS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MESSAGE_LIMITS.MAX_ATTACHMENTS} files allowed` },
        { status: 400 }
      )
    }

    const uploadedFiles: Array<{
      key: string
      url: string
      fileName: string
      fileSize: number
      mimeType: string
    }> = []

    for (const file of files) {
      // Validate each file
      const validation = validateFile(
        file,
        MESSAGE_LIMITS.ALLOWED_ATTACHMENT_TYPES as unknown as string[],
        MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE
      )

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: `${file.name}: ${validation.error}` },
          { status: 400 }
        )
      }

      // Sanitize filename to prevent path traversal and other attacks
      const safeFileName = sanitizeFilename(file.name)

      // Generate unique key
      const key = generateFileKey('message-attachments', file.name, session.user.id)

      // Upload to R2
      const buffer = Buffer.from(await file.arrayBuffer())
      const url = await uploadFile(key, buffer, file.type)

      uploadedFiles.push({
        key,
        url,
        fileName: safeFileName,
        fileSize: file.size,
        mimeType: file.type,
      })
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles,
    })
  } catch (error) {
    console.error('POST /api/messages/upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
