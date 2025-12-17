import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile, validateFile, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES, MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '@/lib/r2'

// POST /api/upload - Upload a file to R2
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
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'image' | 'file'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const isImage = type === 'image'
    const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE

    const validation = validateFile(file, allowedTypes, maxSize)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const folder = isImage ? 'images' : 'files'
    const key = `${folder}/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(key, buffer, file.type)

    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
