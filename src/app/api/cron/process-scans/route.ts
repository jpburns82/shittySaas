import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAnalysisResults } from '@/lib/virustotal'
import { deleteFile } from '@/lib/r2'
import { alertMalwareDetected } from '@/lib/twilio'
import { ScanStatus } from '@prisma/client'

// GET /api/cron/process-scans - Poll VT for pending scan results
// Called by cron-job.org every 5 minutes
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Require valid authorization - reject if CRON_SECRET not set
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find files with SCANNING status that have an analysis ID
    const pendingScans = await prisma.listingFile.findMany({
      where: {
        scanStatus: 'SCANNING',
        vtAnalysisId: { not: null },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
      take: 50, // Process up to 50 per run to avoid rate limits
    })

    console.log(`[process-scans] Found ${pendingScans.length} pending scans`)

    const results = {
      processed: 0,
      completed: 0,
      stillPending: 0,
      malicious: 0,
      errors: [] as string[],
    }

    for (const file of pendingScans) {
      results.processed++

      if (!file.vtAnalysisId) {
        results.errors.push(`${file.id}: No analysis ID`)
        continue
      }

      try {
        const analysisResult = await getAnalysisResults(file.vtAnalysisId)

        if (!analysisResult.complete) {
          // Still processing
          results.stillPending++
          continue
        }

        if (!analysisResult.result) {
          console.error(`[process-scans] No result for ${file.id}`)
          results.errors.push(`${file.id}: No result returned`)
          continue
        }

        const { verdict, detections, totalEngines, hash, rawResult } = analysisResult.result

        // Map verdict to ScanStatus
        let newStatus: ScanStatus
        switch (verdict) {
          case 'CLEAN':
            newStatus = 'CLEAN'
            break
          case 'SUSPICIOUS':
            newStatus = 'SUSPICIOUS'
            break
          case 'MALICIOUS':
            newStatus = 'MALICIOUS'
            break
          default:
            newStatus = 'ERROR'
        }

        // Update the file record
        await prisma.listingFile.update({
          where: { id: file.id },
          data: {
            scanStatus: newStatus,
            scannedAt: new Date(),
            detections,
            totalEngines,
            fileHash: hash || file.fileHash,
            scanResult: rawResult ? JSON.parse(JSON.stringify(rawResult)) : undefined,
          },
        })

        console.log(`[process-scans] File ${file.id}: ${newStatus} (${detections}/${totalEngines})`)
        results.completed++

        // If malicious, delete from R2 and update listing
        if (newStatus === 'MALICIOUS') {
          results.malicious++
          console.log(`[process-scans] Deleting malicious file: ${file.fileKey}`)

          try {
            await deleteFile(file.fileKey)
          } catch (deleteError) {
            console.error(`[process-scans] Failed to delete ${file.fileKey}:`, deleteError)
          }

          // Send Twilio alert for malware detection
          await alertMalwareDetected(file.fileName, detections, totalEngines)

          // TODO: Email seller about rejected file (Phase 4)
        }
      } catch (error) {
        console.error(`[process-scans] Error processing ${file.id}:`, error)
        results.errors.push(`${file.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)

        // Mark as ERROR after too many failures
        await prisma.listingFile.update({
          where: { id: file.id },
          data: { scanStatus: 'ERROR' },
        })
      }
    }

    console.log(`[process-scans] Complete: ${results.completed} completed, ${results.stillPending} pending, ${results.malicious} malicious`)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('[process-scans] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
