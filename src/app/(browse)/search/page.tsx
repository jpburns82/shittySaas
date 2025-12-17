import { prisma } from '@/lib/prisma'
import { PaginatedListingGrid } from '@/components/listings/listing-grid'
import { SearchBar } from '@/components/search/search-bar'
import { Filters, ActiveFilters } from '@/components/search/filters'
import { PAGINATION } from '@/lib/constants'
import type { Prisma } from '@prisma/client'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    priceType?: string
    sort?: string
    page?: string
  }>
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q

  return {
    title: query ? `Search: ${query}` : 'Search Listings',
    description: query
      ? `Search results for "${query}" on SideProject.deals`
      : 'Search for software projects, SaaS apps, and boilerplates.',
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const page = parseInt(params.page || '1')
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  // Fetch categories for filters
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // If no query, show empty state
  if (!query.trim()) {
    return (
      <div className="container py-8">
        <h1 className="font-display text-2xl mb-6">Search</h1>

        <div className="max-w-xl mx-auto mb-8">
          <SearchBar placeholder="Search projects, tech stack, etc..." />
        </div>

        <div className="text-center text-text-muted py-12">
          <p className="font-display text-xl mb-2">Enter a search term</p>
          <p>Search by title, description, or tech stack.</p>
        </div>
      </div>
    )
  }

  // Build where clause
  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { techStack: { has: query } },
    ],
  }

  if (params.category && params.category !== 'all') {
    where.category = { slug: params.category }
  }

  if (params.priceType && params.priceType !== 'all') {
    where.priceType = params.priceType as Prisma.EnumPriceTypeFilter['equals']
  }

  // Build orderBy
  let orderBy: Prisma.ListingOrderByWithRelationInput = { voteScore: 'desc' }
  switch (params.sort) {
    case 'newest':
      orderBy = { createdAt: 'desc' }
      break
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'price_asc':
      orderBy = { priceInCents: 'asc' }
      break
    case 'price_desc':
      orderBy = { priceInCents: 'desc' }
      break
  }

  // Fetch results
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        seller: {
          select: { username: true, isVerifiedSeller: true },
        },
        category: {
          select: { slug: true, name: true },
        },
      },
    }),
    prisma.listing.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl mb-6">
        Search Results for &quot;{query}&quot;
      </h1>

      {/* Search bar */}
      <div className="max-w-xl mb-6">
        <SearchBar placeholder="Search projects..." />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Filters categories={categories} />
      </div>

      {/* Active filters */}
      <div className="mb-4">
        <ActiveFilters />
      </div>

      {/* Results */}
      <PaginatedListingGrid
        listings={listings}
        page={page}
        totalPages={totalPages}
        total={total}
        emptyMessage={`No results found for "${query}". Try different keywords.`}
      />
    </div>
  )
}
