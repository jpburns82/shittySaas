import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile, validateFile, deleteFile, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES, MAX_IMAGE_SIZE, MAX_FILE_SIZE } from '@/lib/r2'
import { scanFile, shouldScanFile, getFileHash } from '@/lib/virustotal'

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

    // Scan non-image files with VirusTotal
    let scanResult = null
    if (!isImage && shouldScanFile(file.type, file.name)) {
      try {
        scanResult = await scanFile(buffer, file.name)

        // If malicious, delete from R2 and reject
        if (scanResult.verdict === 'MALICIOUS') {
          console.log(`[Upload] Malicious file rejected: ${file.name}`)
          await deleteFile(key)
          return NextResponse.json(
            { success: false, error: 'File rejected: malware detected' },
            { status: 400 }
          )
        }
      } catch (scanError) {
        // Log but don't block upload on scan errors
        console.error('[Upload] Scan error (continuing):', scanError)
        // Set scan status to ERROR so cron can retry later
        scanResult = {
          verdict: 'ERROR' as const,
          detections: 0,
          totalEngines: 0,
          hash: getFileHash(buffer),
        }
      }
    } else if (!isImage) {
      // File type not scannable, mark as SKIPPED
      scanResult = {
        verdict: 'SKIPPED' as const,
        detections: 0,
        totalEngines: 0,
        hash: getFileHash(buffer),
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        filename: file.name,
        size: file.size,
        type: file.type,
        // Scan info (for files only)
        scan: scanResult ? {
          status: scanResult.verdict === 'UNKNOWN' && 'needsPolling' in scanResult && scanResult.needsPolling
            ? 'SCANNING'
            : scanResult.verdict === 'SKIPPED'
              ? 'SKIPPED'
              : scanResult.verdict === 'ERROR'
                ? 'ERROR'
                : scanResult.verdict === 'CLEAN'
                  ? 'CLEAN'
                  : scanResult.verdict === 'SUSPICIOUS'
                    ? 'SUSPICIOUS'
                    : 'PENDING',
          hash: scanResult.hash,
          detections: scanResult.detections,
          totalEngines: scanResult.totalEngines,
          analysisId: 'analysisId' in scanResult ? scanResult.analysisId : undefined,
        } : undefined,
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
