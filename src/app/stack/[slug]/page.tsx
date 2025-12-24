import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import { ListingCard } from '@/components/listings/listing-card'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const stackName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return {
    title: `${stackName} Projects & Templates`,
    description: `Buy ${stackName} projects, boilerplates, and starter kits from indie developers on UndeadList.`,
  }
}

export default async function StackPage({ params }: Props) {
  const { slug } = await params
  const stackSlug = slug.toLowerCase()

  // Build case-insensitive search variations
  const searchVariations = [
    stackSlug,
    stackSlug.charAt(0).toUpperCase() + stackSlug.slice(1),
    stackSlug.toUpperCase(),
  ]

  // Find listings where techStack array contains this tech (case-insensitive via variations)
  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      techStack: {
        hasSome: searchVariations,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      priceType: true,
      priceInCents: true,
      thumbnailUrl: true,
      techStack: true,
      voteScore: true,
      upvoteCount: true,
      downvoteCount: true,
      createdAt: true,
      featured: true,
      repoUrl: true,
      seller: {
        select: {
          username: true,
          isVerifiedSeller: true,
          sellerTier: true,
          githubVerifiedAt: true,
          githubUsername: true,
        },
      },
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  const displayName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <main className="container py-8">
      <h1 className="font-display text-3xl mb-2">{displayName} Projects</h1>
      <p className="text-text-muted mb-8">
        Pre-built {displayName} projects, templates, and starter kits from indie developers.
      </p>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted text-lg">No {displayName} projects listed yet.</p>
          <p className="text-text-muted mt-2">Check back soon or browse our other listings!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  )
}

export function generateStaticParams() {
  return [
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
  ].map(slug => ({ slug }))
}
