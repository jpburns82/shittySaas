/**
 * Clean Test Data Script
 *
 * Removes all test data from the database while preserving:
 * - Admin users
 * - Categories (static data)
 * - Audit logs (for record keeping)
 *
 * Run with: pnpm tsx scripts/clean-test-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanTestData() {
  console.log('🧹 Starting test data cleanup...\n')

  try {
    // Delete in order of dependencies (child tables first)

    // 1. Message attachments
    const attachments = await prisma.messageAttachment.deleteMany({})
    console.log(`  ✓ Deleted ${attachments.count} message attachments`)

    // 2. Messages
    const messages = await prisma.message.deleteMany({})
    console.log(`  ✓ Deleted ${messages.count} messages`)

    // 3. User warnings (depends on MessageThread and User)
    const warnings = await prisma.userWarning.deleteMany({})
    console.log(`  ✓ Deleted ${warnings.count} user warnings`)

    // 4. Message threads
    const threads = await prisma.messageThread.deleteMany({})
    console.log(`  ✓ Deleted ${threads.count} message threads`)

    // 5. Comments (self-referential, Prisma handles cascade)
    const comments = await prisma.comment.deleteMany({})
    console.log(`  ✓ Deleted ${comments.count} comments`)

    // 6. Votes
    const votes = await prisma.vote.deleteMany({})
    console.log(`  ✓ Deleted ${votes.count} votes`)

    // 7. Purchases
    const purchases = await prisma.purchase.deleteMany({})
    console.log(`  ✓ Deleted ${purchases.count} purchases`)

    // 8. Listing views
    const views = await prisma.listingView.deleteMany({})
    console.log(`  ✓ Deleted ${views.count} listing views`)

    // 9. Listing files
    const files = await prisma.listingFile.deleteMany({})
    console.log(`  ✓ Deleted ${files.count} listing files`)

    // 10. Featured purchases
    const featuredPurchases = await prisma.featuredPurchase.deleteMany({})
    console.log(`  ✓ Deleted ${featuredPurchases.count} featured purchases`)

    // 11. Reports
    const reports = await prisma.report.deleteMany({})
    console.log(`  ✓ Deleted ${reports.count} reports`)

    // 12. Listings
    const listings = await prisma.listing.deleteMany({})
    console.log(`  ✓ Deleted ${listings.count} listings`)

    // 13. Blocked users
    const blocked = await prisma.blockedUser.deleteMany({})
    console.log(`  ✓ Deleted ${blocked.count} blocked user entries`)

    // 14. Non-admin users
    const users = await prisma.user.deleteMany({
      where: {
        isAdmin: false
      }
    })
    console.log(`  ✓ Deleted ${users.count} non-admin users`)

    // Optionally clear audit logs (commented out to preserve admin action history)
    // const auditLogs = await prisma.auditLog.deleteMany({})
    // console.log(`  ✓ Deleted ${auditLogs.count} audit logs`)

    console.log('\n✅ Test data cleanup complete!')
    console.log('\nRemaining data:')

    const adminCount = await prisma.user.count({ where: { isAdmin: true } })
    const categoryCount = await prisma.category.count()

    console.log(`  - ${adminCount} admin user(s)`)
    console.log(`  - ${categoryCount} categories`)

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanTestData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
