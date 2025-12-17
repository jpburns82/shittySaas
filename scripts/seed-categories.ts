/**
 * Seed categories script
 *
 * This is an alias for the Prisma seed script.
 * Run with: pnpm tsx scripts/seed-categories.ts
 *
 * Or use the package.json script: pnpm db:seed
 */

import { execSync } from 'child_process'

console.log('🌱 Seeding categories...')

try {
  execSync('pnpm prisma db seed', { stdio: 'inherit' })
  console.log('✅ Categories seeded successfully!')
} catch (error) {
  console.error('❌ Failed to seed categories:', error)
  process.exit(1)
}
