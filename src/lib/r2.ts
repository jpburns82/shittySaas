import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

// File type definitions
type FileCategory = 'screenshots' | 'files' | 'avatars'

function getKeyPrefix(category: FileCategory): string {
  switch (category) {
    case 'screenshots':
      return 'screenshots'
    case 'files':
      return 'deliverables'
    case 'avatars':
      return 'avatars'
  }
}

// Generate unique file key
export function generateFileKey(
  category: FileCategory,
  originalFilename: string,
  userId: string
): string {
  const ext = originalFilename.split('.').pop() || ''
  const uniqueId = nanoid(12)
  const prefix = getKeyPrefix(category)
  return `${prefix}/${userId}/${uniqueId}.${ext}`
}

// Upload file to R2
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  return `${PUBLIC_URL}/${key}`
}

// Delete file from R2
export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}

// Generate presigned URL for upload (client-side uploads)
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

// Generate presigned URL for download (private files)
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

// Get public URL for a file
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

// Extract key from full URL
export function getKeyFromUrl(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, '')
}

// Validate file type
export function isAllowedFileType(
  mimeType: string,
  category: FileCategory
): boolean {
  const allowedTypes: Record<FileCategory, string[]> = {
    screenshots: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    files: [
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/x-7z-compressed',
      'application/vnd.rar',
    ],
    avatars: ['image/png', 'image/jpeg', 'image/webp'],
  }

  return allowedTypes[category].includes(mimeType)
}

// Validate file size
export function isValidFileSize(
  sizeInBytes: number,
  category: FileCategory
): boolean {
  const maxSizes: Record<FileCategory, number> = {
    screenshots: 5 * 1024 * 1024, // 5MB
    files: 100 * 1024 * 1024, // 100MB
    avatars: 2 * 1024 * 1024, // 2MB
  }

  return sizeInBytes <= maxSizes[category]
}

// ----- EXPORTED CONSTANTS FOR API ROUTES -----

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/zip',
  'application/x-tar',
  'application/gzip',
  'application/x-7z-compressed',
  'application/vnd.rar',
  'application/x-zip-compressed',
]
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

// Validate file helper for API routes
export function validateFile(
  file: { type: string; size: number },
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB` }
  }
  return { valid: true }
}
