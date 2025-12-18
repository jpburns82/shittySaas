import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  uploadFile,
  deleteFile,
  generateFileKey,
  getKeyFromUrl,
  isAllowedFileType,
  isValidFileSize,
} from '@/lib/r2'

// POST /api/user/avatar - Upload new avatar
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
    if (!isAllowedFileType(file.type, 'avatars')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max for avatars)
    if (!isValidFileSize(file.size, 'avatars')) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max size: 2MB' },
        { status: 400 }
      )
    }

    // Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    // Delete old avatar if exists
    if (user?.avatarUrl && user.avatarUrl.includes('r2.dev')) {
      try {
        const oldKey = getKeyFromUrl(user.avatarUrl)
        await deleteFile(oldKey)
      } catch (err) {
        // Log but don't fail if old file deletion fails
        console.error('Failed to delete old avatar:', err)
      }
    }

    // Upload new avatar
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = generateFileKey('avatars', file.name, session.user.id)
    const url = await uploadFile(key, buffer, file.type)

    // Update user with new avatar URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: url },
    })

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error('POST /api/user/avatar error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/avatar - Remove avatar
export async function DELETE() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    if (!user?.avatarUrl) {
      return NextResponse.json(
        { success: false, error: 'No avatar to delete' },
        { status: 400 }
      )
    }

    // Delete from R2 if it's an R2 URL
    if (user.avatarUrl.includes('r2.dev')) {
      try {
        const key = getKeyFromUrl(user.avatarUrl)
        await deleteFile(key)
      } catch (err) {
        console.error('Failed to delete avatar from R2:', err)
      }
    }

    // Update user to remove avatar URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/user/avatar error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
