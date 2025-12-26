// Seed welcome post for BackPage
// Run: pnpm tsx scripts/seed-backpage-welcome.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getNextMonday(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)
  return nextMonday
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) +
    '-' +
    Date.now().toString(36)
  )
}

async function main() {
  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true, username: true },
  })

  if (!admin) {
    console.error('No admin user found!')
    process.exit(1)
  }

  console.log(`Found admin: @${admin.username}`)

  // Check if welcome post already exists
  const existingPost = await prisma.backPagePost.findFirst({
    where: {
      authorId: admin.id,
      title: { contains: 'Welcome' },
    },
  })

  if (existingPost) {
    console.log('Welcome post already exists, skipping...')
    return
  }

  // Create welcome post
  const title = 'Welcome to Back Page'
  const body = `Welcome to the Back Page - UndeadList's weekly community board.

This is a space for indie developers to connect, share, and discuss. Here's what you can do:

**General** - Announcements, news, and general discussion
**Show & Tell** - Share what you're building or have shipped
**Looking For** - Find collaborators, beta testers, or feedback
**Help** - Ask questions or get advice from the community

Posts reset every Monday at 00:00 UTC, so jump in and start a conversation.

Happy building!`

  const post = await prisma.backPagePost.create({
    data: {
      title,
      body,
      slug: generateSlug(title),
      category: 'GENERAL',
      authorId: admin.id,
      expiresAt: getNextMonday(),
    },
  })

  console.log(`Created welcome post: ${post.slug}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
