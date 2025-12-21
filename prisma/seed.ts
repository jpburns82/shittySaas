import { PrismaClient, PriceType } from '@prisma/client'

const prisma = new PrismaClient()

// Demo listings data
const demoListings = [
  {
    slug: 'prometheus-ai',
    title: 'Prometheus AI',
    shortDescription: 'Offline AI chat app bundling Ollama + Dolphin Mistral in a single installer',
    description: 'A fully offline AI chat application that bundles Ollama with the Dolphin Mistral model. Single installer for Windows, Mac, and Linux. No internet required after installation.',
    priceType: 'FIXED' as PriceType,
    priceInCents: 199,
    techStack: ['Tauri', 'Rust', 'React', 'Ollama'],
    thumbnailUrl: '/images/seed/prometheus_thumbnail2.png',
    categorySlug: 'ai',
  },
  {
    slug: 'astral-saas',
    title: 'Astral',
    shortDescription: 'Beautiful SaaS starter kit with auth, payments, and dashboard built-in',
    description: 'Launch your SaaS faster with Astral. Includes authentication, Stripe payments, admin dashboard, email templates, and more. Built with Next.js 14 and Tailwind CSS.',
    priceType: 'FIXED' as PriceType,
    priceInCents: 4999,
    techStack: ['Next.js', 'TypeScript', 'Stripe', 'Prisma'],
    thumbnailUrl: '/images/seed/astral_logo_color.png',
    categorySlug: 'saas',
  },
  {
    slug: 'breakupbot',
    title: 'BreakupBot',
    shortDescription: 'AI-powered relationship advice and breakup text generator',
    description: 'Let AI handle the awkward conversations. BreakupBot generates thoughtful, empathetic breakup messages tailored to your situation. Includes API access.',
    priceType: 'FIXED' as PriceType,
    priceInCents: 299,
    techStack: ['Python', 'FastAPI', 'OpenAI', 'React'],
    thumbnailUrl: '/images/seed/breakupbotlogo.png',
    categorySlug: 'ai',
  },
  {
    slug: 'y2k-aesthetic-kit',
    title: 'Y2K Aesthetic Kit',
    shortDescription: 'Retro Y2K design system with components, icons, and animations',
    description: 'Bring back the 2000s vibes with this comprehensive Y2K design kit. Includes 50+ components, 200+ icons, gradient presets, and CSS animations. Perfect for nostalgic web projects.',
    priceType: 'FIXED' as PriceType,
    priceInCents: 1499,
    techStack: ['Figma', 'CSS', 'React', 'Tailwind'],
    thumbnailUrl: '/images/seed/y2k_logo.png',
    categorySlug: 'design',
  },
]

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
    name: 'Social Media Accounts',
    slug: 'social-media',
    description: 'TikTok, YouTube, Instagram, Twitter accounts',
    icon: '👥',
    sortOrder: 12,
  },
  {
    name: 'Newsletters',
    slug: 'newsletters',
    description: 'Email lists, Substacks, audience',
    icon: '📧',
    sortOrder: 13,
  },
  {
    name: 'Online Communities',
    slug: 'communities',
    description: 'Discord servers, forums, groups',
    icon: '💬',
    sortOrder: 14,
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

  console.log('\n🌱 Finding seller user...')

  // Find and update existing ghostdev user with avatar
  // Password: Seller123! (bcrypt hash)
  const sellerPasswordHash = '$2a$10$K5EHqFxlhpnKwYxwvZqQYu.9JK0bL7qXzF.r8Xz0J3QxZ5LdYF5Xe'
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@undeadlist.test' },
    update: {
      avatarUrl: '/images/avatars/ghostdev.png',
    },
    create: {
      email: 'seller@undeadlist.test',
      username: 'ghostdev',
      displayName: 'Ghost Developer',
      isVerifiedSeller: true,
      avatarUrl: '/images/avatars/ghostdev.png',
      passwordHash: sellerPasswordHash,
    },
  })
  console.log(`  ✓ Seller user: @${sellerUser.username}`)

  console.log('\n🌱 Seeding demo listings...')

  for (const listing of demoListings) {
    // Get the category by slug
    const category = await prisma.category.findUnique({
      where: { slug: listing.categorySlug },
    })

    if (!category) {
      console.log(`  ✗ Category not found: ${listing.categorySlug}`)
      continue
    }

    const result = await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: {
        title: listing.title,
        shortDescription: listing.shortDescription,
        description: listing.description,
        priceType: listing.priceType,
        priceInCents: listing.priceInCents,
        techStack: listing.techStack,
        thumbnailUrl: listing.thumbnailUrl,
        featured: true,
        featuredUntil: null, // indefinite
        status: 'ACTIVE',
      },
      create: {
        slug: listing.slug,
        title: listing.title,
        shortDescription: listing.shortDescription,
        description: listing.description,
        priceType: listing.priceType,
        priceInCents: listing.priceInCents,
        techStack: listing.techStack,
        thumbnailUrl: listing.thumbnailUrl,
        categoryId: category.id,
        sellerId: sellerUser.id,
        featured: true,
        featuredUntil: null, // indefinite
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    })
    console.log(`  ✓ ${result.title}`)
  }

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
