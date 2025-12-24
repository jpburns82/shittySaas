import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFile } from '@/lib/r2'
import { scanFile, shouldScanFile } from '@/lib/virustotal'
import { nanoid } from 'nanoid'
import type { Prisma as _Prisma } from '@prisma/client'

// Allowed file types for instant download
const ALLOWED_FILE_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
  'application/x-7z-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/pdf',
  'text/plain',
  'text/markdown',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/listings/[id]/files - List files for a listing
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: listingId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get files
    const files = await prisma.listingFile.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: files,
    })
  } catch (error) {
    console.error('GET /api/listings/[id]/files error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

// POST /api/listings/[id]/files - Upload a file for instant download
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: listingId } = await params
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to upload files for this listing' },
        { status: 403 }
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
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: ZIP, TAR, RAR, 7Z, PDF, TXT, MD' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max size: 50MB' },
        { status: 400 }
      )
    }

    // Generate unique key with original extension
    const ext = file.name.split('.').pop() || 'bin'
    const uniqueId = nanoid(12)
    const fileKey = `downloads/${listingId}/${uniqueId}.${ext}`

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadFile(fileKey, buffer, file.type)

    // Create database record
    const listingFile = await prisma.listingFile.create({
      data: {
        listingId,
        fileName: file.name,
        fileSize: file.size,
        fileKey,
        mimeType: file.type,
      },
    })

    // Scan file with VirusTotal if applicable
    if (shouldScanFile(file.type, file.name)) {
      try {
        const scanResult = await scanFile(buffer, file.name)

        // Reject malicious files
        if (scanResult.verdict === 'MALICIOUS') {
          await deleteFile(fileKey)
          await prisma.listingFile.delete({ where: { id: listingFile.id } })
          return NextResponse.json(
            { success: false, error: 'File rejected: malware detected' },
            { status: 400 }
          )
        }

        await prisma.listingFile.update({
          where: { id: listingFile.id },
          data: {
            fileHash: scanResult.hash,
            scanStatus: scanResult.verdict === 'CLEAN' ? 'CLEAN'
              : scanResult.verdict === 'SUSPICIOUS' ? 'SUSPICIOUS'
              : scanResult.needsPolling ? 'SCANNING'
              : 'PENDING',
            scanResult: JSON.parse(JSON.stringify(scanResult)),
            scannedAt: new Date(),
            detections: scanResult.detections || 0,
            totalEngines: scanResult.totalEngines || 0,
            vtAnalysisId: scanResult.analysisId || null,
          },
        })
      } catch (err) {
        console.error('[ListingFiles] Scan error:', err)
        await prisma.listingFile.update({
          where: { id: listingFile.id },
          data: { scanStatus: 'ERROR', scannedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: listingFile,
    })
  } catch (error) {
    console.error('POST /api/listings/[id]/files error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id]/files - Delete a file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: _listingId } = await params // Ownership verified via file.listing
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      )
    }

    // Get file and verify ownership
    const file = await prisma.listingFile.findUnique({
      where: { id: fileId },
      include: {
        listing: {
          select: { sellerId: true },
        },
      },
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    if (file.listing.sellerId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this file' },
        { status: 403 }
      )
    }

    // Delete from R2
    await deleteFile(file.fileKey)

    // Delete database record
    await prisma.listingFile.delete({
      where: { id: fileId },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/listings/[id]/files error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
