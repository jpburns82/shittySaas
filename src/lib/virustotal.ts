import crypto from 'crypto'
import { createLogger } from './logger'

const log = createLogger('virustotal')

const VT_API_URL = 'https://www.virustotal.com/api/v3'
const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY!

export type ScanVerdict = 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' | 'ERROR'

export interface ScanResult {
  verdict: ScanVerdict
  detections: number
  totalEngines: number
  hash: string
  analysisId?: string
  rawResult?: Record<string, unknown>
}

/**
 * Calculate SHA256 hash of a file buffer
 */
export function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Check if a file hash is already known to VirusTotal
 * This is instant and doesn't count against upload quota
 */
export async function checkHashReputation(hash: string): Promise<ScanResult> {
  try {
    const response = await fetch(`${VT_API_URL}/files/${hash}`, {
      headers: { 'x-apikey': VT_API_KEY },
    })

    if (response.status === 404) {
      // File not known to VT - needs upload
      return {
        verdict: 'UNKNOWN',
        detections: 0,
        totalEngines: 0,
        hash,
      }
    }

    if (!response.ok) {
      log.error('Hash check failed', { status: response.status })
      return {
        verdict: 'ERROR',
        detections: 0,
        totalEngines: 0,
        hash,
      }
    }

    const data = await response.json()
    return parseVTResponse(data, hash)
  } catch (error) {
    log.error('Hash check error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      verdict: 'ERROR',
      detections: 0,
      totalEngines: 0,
      hash,
    }
  }
}

/**
 * Upload a file to VirusTotal for scanning
 * Only use this for files not found by hash check
 * Returns analysisId for polling
 */
export async function uploadForScan(
  buffer: Buffer,
  filename: string
): Promise<{ success: boolean; analysisId?: string; error?: string }> {
  try {
    // For files > 32MB, need to get upload URL first
    // Most files will be under this limit
    const formData = new FormData()
    // Create blob from buffer
    const blob = new Blob([buffer as unknown as BlobPart])
    formData.append('file', blob, filename)

    const response = await fetch(`${VT_API_URL}/files`, {
      method: 'POST',
      headers: { 'x-apikey': VT_API_KEY },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('Upload failed', { status: response.status, error: errorText })
      return { success: false, error: `Upload failed: ${response.status}` }
    }

    const data = await response.json()
    const analysisId = data.data?.id

    if (!analysisId) {
      return { success: false, error: 'No analysis ID returned' }
    }

    log.info('File uploaded', { analysisId })
    return { success: true, analysisId }
  } catch (error) {
    log.error('Upload error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

/**
 * Get analysis results by analysis ID
 * Used for polling pending scans
 */
export async function getAnalysisResults(analysisId: string): Promise<{
  complete: boolean
  result?: ScanResult
  error?: string
}> {
  try {
    const response = await fetch(`${VT_API_URL}/analyses/${analysisId}`, {
      headers: { 'x-apikey': VT_API_KEY },
    })

    if (!response.ok) {
      log.error('Analysis fetch failed', { status: response.status })
      return { complete: false, error: `Fetch failed: ${response.status}` }
    }

    const data = await response.json()
    const status = data.data?.attributes?.status

    if (status !== 'completed') {
      // Still processing
      return { complete: false }
    }

    // Get the file hash from the analysis
    const sha256 = data.meta?.file_info?.sha256 || data.data?.attributes?.sha256 || ''

    // Fetch full file report using the hash
    if (sha256) {
      const fileResult = await checkHashReputation(sha256)
      return { complete: true, result: fileResult }
    }

    // Fallback: parse analysis response directly
    const stats = data.data?.attributes?.stats || {}
    const detections = (stats.malicious || 0) + (stats.suspicious || 0)
    const totalEngines = Object.values(stats).reduce((a: number, b) => a + (b as number), 0)

    return {
      complete: true,
      result: {
        verdict: getVerdict(detections, totalEngines),
        detections,
        totalEngines,
        hash: sha256,
        analysisId,
        rawResult: data,
      },
    }
  } catch (error) {
    log.error('Analysis fetch error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { complete: false, error: error instanceof Error ? error.message : 'Fetch failed' }
  }
}

/**
 * Convenience function: scan a file (hash check first, then upload if needed)
 */
export async function scanFile(
  buffer: Buffer,
  filename: string
): Promise<ScanResult & { needsPolling?: boolean }> {
  const hash = getFileHash(buffer)

  // First, check if hash is already known
  const hashResult = await checkHashReputation(hash)

  if (hashResult.verdict !== 'UNKNOWN') {
    // File is known, return result immediately
    log.info('File known by hash', { filename, verdict: hashResult.verdict })
    return hashResult
  }

  // File unknown, upload for scanning
  log.info('File unknown, uploading for scan', { filename })
  const uploadResult = await uploadForScan(buffer, filename)

  if (!uploadResult.success) {
    return {
      verdict: 'ERROR',
      detections: 0,
      totalEngines: 0,
      hash,
    }
  }

  // Return pending state - cron will poll for results
  return {
    verdict: 'UNKNOWN',
    detections: 0,
    totalEngines: 0,
    hash,
    analysisId: uploadResult.analysisId,
    needsPolling: true,
  }
}

/**
 * Parse VirusTotal file report response
 */
function parseVTResponse(data: Record<string, unknown>, hash: string): ScanResult {
  const attributes = (data.data as Record<string, unknown>)?.attributes as Record<string, unknown>
  const stats = attributes?.last_analysis_stats as Record<string, number> | undefined

  if (!stats) {
    return {
      verdict: 'ERROR',
      detections: 0,
      totalEngines: 0,
      hash,
    }
  }

  const detections = (stats.malicious || 0) + (stats.suspicious || 0)
  const totalEngines =
    (stats.malicious || 0) +
    (stats.suspicious || 0) +
    (stats.undetected || 0) +
    (stats.harmless || 0) +
    (stats.timeout || 0) +
    (stats.failure || 0)

  return {
    verdict: getVerdict(detections, totalEngines),
    detections,
    totalEngines,
    hash,
    rawResult: data as Record<string, unknown>,
  }
}

/**
 * Determine verdict based on detection ratio
 */
function getVerdict(detections: number, totalEngines: number): ScanVerdict {
  if (totalEngines === 0) return 'UNKNOWN'

  // Thresholds (adjust as needed)
  // 0 detections = CLEAN
  // 1-2 detections = SUSPICIOUS (could be false positive)
  // 3+ detections = MALICIOUS
  if (detections === 0) return 'CLEAN'
  if (detections <= 2) return 'SUSPICIOUS'
  return 'MALICIOUS'
}

/**
 * Check if a file type should be scanned
 * Skip non-executable types like images, fonts, etc.
 */
export function shouldScanFile(mimeType: string | null, filename: string): boolean {
  const skipMimeTypes = [
    'image/',
    'font/',
    'audio/',
    'video/',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
  ]

  if (mimeType && skipMimeTypes.some((skip) => mimeType.startsWith(skip))) {
    return false
  }

  // Skip by extension
  const skipExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.mp3', '.mp4', '.wav', '.avi', '.mov',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml',
    '.pdf', // Could enable PDF scanning if needed
  ]

  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  if (skipExtensions.includes(ext)) {
    return false
  }

  return true
}
