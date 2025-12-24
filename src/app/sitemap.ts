import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://undeadlist.com'

  // Static pages
  const staticPages = [
    '',
    '/listings',
    '/search',
    '/resources',
    '/resources/sellers',
    '/resources/buyers',
    '/faq',
    '/about',
    '/terms',
    '/privacy',
    '/contact',
    '/login',
    '/register',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic listing pages
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { slug: true, updatedAt: true },
  })

  const listingPages = listings.map(listing => ({
    url: `${baseUrl}/listing/${listing.slug}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Dynamic category pages
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  })

  const categoryPages = categories.map(cat => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  // User profile pages (public profiles)
  const users = await prisma.user.findMany({
    where: { deletedAt: null, isBanned: false },
    select: { username: true },
    take: 1000, // Limit for performance
  })

  const userPages = users.map(user => ({
    url: `${baseUrl}/user/${user.username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Stack/technology pages for SEO
  const stackSlugs = [
    'nextjs',
    'react',
    'typescript',
    'tailwind',
    'prisma',
    'supabase',
    'stripe',
    'python',
    'node',
    'rust',
    'tauri',
    'electron',
    'openai',
    'langchain',
    'vue',
    'svelte',
    'astro',
    'remix',
    'express',
    'fastapi',
  ]

  const stackPages = stackSlugs.map(slug => ({
    url: `${baseUrl}/stack/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...listingPages, ...categoryPages, ...userPages, ...stackPages]
}
