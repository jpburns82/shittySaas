import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  {
    name: 'SaaS Apps',
    slug: 'saas',
    description: 'Full software-as-a-service applications with users, billing, the works',
    icon: '🚀',
    sortOrder: 1,
  },
  {
    name: 'Mobile Apps',
    slug: 'mobile',
    description: 'iOS, Android, or cross-platform mobile applications',
    icon: '📱',
    sortOrder: 2,
  },
  {
    name: 'Browser Extensions',
    slug: 'extensions',
    description: 'Chrome, Firefox, Safari, and other browser extensions',
    icon: '🧩',
    sortOrder: 3,
  },
  {
    name: 'APIs & Backends',
    slug: 'apis',
    description: 'REST APIs, GraphQL services, and backend systems',
    icon: '⚡',
    sortOrder: 4,
  },
  {
    name: 'Boilerplates & Starters',
    slug: 'boilerplates',
    description: 'Starter templates, boilerplates, and scaffolding projects',
    icon: '📦',
    sortOrder: 5,
  },
  {
    name: 'Scripts & Automations',
    slug: 'scripts',
    description: 'Utility scripts, automation tools, CLI utilities',
    icon: '🤖',
    sortOrder: 6,
  },
  {
    name: 'AI & ML Projects',
    slug: 'ai',
    description: 'AI-powered apps, ML models, LLM wrappers, and integrations',
    icon: '🧠',
    sortOrder: 7,
  },
  {
    name: 'WordPress & CMS',
    slug: 'cms',
    description: 'WordPress themes/plugins, other CMS projects',
    icon: '📝',
    sortOrder: 8,
  },
  {
    name: 'Domains & Landing Pages',
    slug: 'domains',
    description: 'Domain names with or without landing pages',
    icon: '🌐',
    sortOrder: 9,
  },
  {
    name: 'Design Assets',
    slug: 'design',
    description: 'UI kits, Figma files, design systems for apps',
    icon: '🎨',
    sortOrder: 10,
  },
  {
    name: 'Games',
    slug: 'games',
    description: 'Web games, mobile games, game templates',
    icon: '🎮',
    sortOrder: 11,
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Everything else that doesn\'t fit above',
    icon: '📁',
    sortOrder: 99,
  },
]

async function main() {
  console.log('🌱 Seeding categories...')
  
  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
    console.log(`  ✓ ${result.name}`)
  }
  
  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
