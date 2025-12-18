import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  uploadFile,
  generateFileKey,
  isAllowedFileType,
  isValidFileSize,
} from '@/lib/r2'

// POST /api/listings/screenshots - Upload screenshot(s)
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

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isAllowedFileType(file.type, 'screenshots')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PNG, JPEG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max for screenshots)
    if (!isValidFileSize(file.size, 'screenshots')) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max size: 5MB' },
        { status: 400 }
      )
    }

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = generateFileKey('screenshots', file.name, session.user.id)
    const url = await uploadFile(key, buffer, file.type)

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error('POST /api/listings/screenshots error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload screenshot' },
      { status: 500 }
    )
  }
}
