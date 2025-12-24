/**
 * SAFE Category-Only Seed Script
 *
 * This script ONLY upserts categories. It does NOT:
 * - Create users
 * - Create listings
 * - Delete any data
 * - Modify any existing data except category names
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'SaaS Apps',
    slug: 'saas',
    description: 'Full software-as-a-service applications with users, billing, the works',
    icon: '🚀',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Mobile Apps',
    slug: 'mobile',
    description: 'iOS, Android, or cross-platform mobile applications',
    icon: '📱',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Browser Extensions',
    slug: 'extensions',
    description: 'Chrome, Firefox, Safari, and other browser extensions',
    icon: '🧩',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'APIs & Backends',
    slug: 'apis',
    description: 'REST APIs, GraphQL services, and backend systems',
    icon: '⚡',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Boilerplates & Starters',
    slug: 'boilerplates',
    description: 'Starter templates, boilerplates, and scaffolding projects',
    icon: '📦',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Scripts & Automations',
    slug: 'scripts',
    description: 'Utility scripts, automation tools, CLI utilities',
    icon: '🤖',
    sortOrder: 6,
    isActive: true,
  },
  {
    name: 'AI & ML Projects',
    slug: 'ai',
    description: 'AI-powered apps, ML models, LLM wrappers, and integrations',
    icon: '🧠',
    sortOrder: 7,
    isActive: true,
  },
  {
    name: 'WordPress & CMS',
    slug: 'cms',
    description: 'WordPress themes/plugins, other CMS projects',
    icon: '📝',
    sortOrder: 8,
    isActive: true,
  },
  {
    name: 'Domains & Landing Pages',
    slug: 'domains',
    description: 'Domain names with or without landing pages',
    icon: '🌐',
    sortOrder: 9,
    isActive: true,
  },
  {
    name: 'Design Assets',
    slug: 'design',
    description: 'UI kits, Figma files, design systems for apps',
    icon: '🎨',
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Games',
    slug: 'games',
    description: 'Web games, mobile games, game templates',
    icon: '🎮',
    sortOrder: 11,
    isActive: true,
  },
  {
    name: 'Social Media Accounts',
    slug: 'social-media',
    description: 'TikTok, YouTube, Instagram, Twitter accounts',
    icon: '👥',
    sortOrder: 12,
    isActive: true,
  },
  {
    name: 'Newsletters',
    slug: 'newsletters',
    description: 'Email lists, Substacks, audience',
    icon: '📧',
    sortOrder: 13,
    isActive: true,
  },
  {
    name: 'Online Communities',
    slug: 'communities',
    description: 'Discord servers, forums, groups',
    icon: '💬',
    sortOrder: 14,
    isActive: true,
  },
  {
    name: 'Crypto & Web3',
    slug: 'crypto',
    description: 'Cryptocurrency projects, wallets, trading bots, pump.fun projects',
    icon: '₿',
    sortOrder: 15,
    isActive: true,
  },
  {
    name: 'NFT Projects',
    slug: 'nft',
    description: 'NFT collections, minting sites, marketplaces, token projects',
    icon: '💎',
    sortOrder: 16,
    isActive: true,
  },
  {
    name: 'DeFi & Trading',
    slug: 'defi',
    description: 'DeFi protocols, trading algorithms, yield farming tools',
    icon: '📈',
    sortOrder: 17,
    isActive: true,
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Everything else that doesn\'t fit above',
    icon: '📁',
    sortOrder: 99,
    isActive: true,
  },
]

async function main() {
  console.log('=== SAFE Category-Only Seed ===')
  console.log('This script ONLY upserts categories.\n')

  // Show current counts BEFORE
  const beforeCounts = {
    categories: await prisma.category.count(),
    listings: await prisma.listing.count(),
    users: await prisma.user.count(),
  }
  console.log('BEFORE:')
  console.log(`  Categories: ${beforeCounts.categories}`)
  console.log(`  Listings: ${beforeCounts.listings}`)
  console.log(`  Users: ${beforeCounts.users}`)
  console.log('')

  console.log('Upserting categories...')
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      },
      create: category,
    })
    console.log(`  ✓ ${result.name}`)
  }

  // Show current counts AFTER
  const afterCounts = {
    categories: await prisma.category.count(),
    listings: await prisma.listing.count(),
    users: await prisma.user.count(),
  }
  console.log('\nAFTER:')
  console.log(`  Categories: ${afterCounts.categories}`)
  console.log(`  Listings: ${afterCounts.listings}`)
  console.log(`  Users: ${afterCounts.users}`)

  // Verify nothing else was touched
  if (afterCounts.listings !== beforeCounts.listings) {
    console.error('\n❌ ERROR: Listing count changed!')
  }
  if (afterCounts.users !== beforeCounts.users) {
    console.error('\n❌ ERROR: User count changed!')
  }

  console.log('\n✅ Done. Only categories were modified.')
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
