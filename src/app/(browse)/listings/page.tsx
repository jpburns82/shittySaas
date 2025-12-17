import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { PaginatedListingGrid } from '@/components/listings/listing-grid'
import { CategoryNav } from '@/components/search/category-nav'
import { Filters, ActiveFilters } from '@/components/search/filters'
import { ListingGridSkeleton } from '@/components/ui/spinner'
import { PAGINATION } from '@/lib/constants'
import type { Prisma } from '@prisma/client'

interface ListingsPageProps {
  searchParams: Promise<{
    category?: string
    priceType?: string
    sort?: string
    page?: string
    q?: string
  }>
}

export const metadata = {
  title: 'Browse Listings',
  description: 'Browse all software projects, SaaS apps, and boilerplates for sale.',
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  // Build where clause
  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
  }

  if (params.category) {
    where.category = { slug: params.category }
  }

  if (params.priceType && params.priceType !== 'all') {
    where.priceType = params.priceType as Prisma.EnumPriceTypeFilter['equals']
  }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: 'insensitive' } },
      { shortDescription: { contains: params.q, mode: 'insensitive' } },
      { techStack: { has: params.q } },
    ]
  }

  // Build orderBy
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' }
  switch (params.sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'top':
      orderBy = { voteScore: 'desc' }
      break
    case 'price_asc':
      orderBy = { priceInCents: 'asc' }
      break
    case 'price_desc':
      orderBy = { priceInCents: 'desc' }
      break
  }

  // Fetch data
  const [categories, listings, total] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
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
      <h1 className="font-display text-2xl mb-6">Browse Listings</h1>

      {/* Category navigation */}
      <CategoryNav categories={categories} />

      {/* Filters */}
      <div className="my-6">
        <Filters categories={categories} />
      </div>

      {/* Active filters */}
      <div className="mb-4">
        <ActiveFilters />
      </div>

      {/* Results */}
      <Suspense fallback={<ListingGridSkeleton />}>
        <PaginatedListingGrid
          listings={listings}
          page={page}
          totalPages={totalPages}
          total={total}
          emptyMessage="No listings match your filters."
        />
      </Suspense>
    </div>
  )
}
