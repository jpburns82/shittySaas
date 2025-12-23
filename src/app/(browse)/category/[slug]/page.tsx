import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PaginatedListingGrid } from '@/components/listings/listing-grid'
import { CategoryNav, getCategoryIcon } from '@/components/search/category-nav'
import { PAGINATION } from '@/lib/constants'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await prisma.category.findUnique({
    where: { slug },
  })

  if (!category) {
    return { title: 'Category Not Found' }
  }

  return {
    title: `${category.name} — Browse Projects`,
    description: category.description || `Browse ${category.name} projects on UndeadList`,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const search = await searchParams
  const page = parseInt(search.page || '1')
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  // Fetch category
  const category = await prisma.category.findUnique({
    where: { slug },
  })

  if (!category) {
    notFound()
  }

  // Fetch all categories for nav
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // Build orderBy
  let orderBy: { createdAt?: 'desc' | 'asc'; voteScore?: 'desc' } = { createdAt: 'desc' }
  if (search.sort === 'oldest') orderBy = { createdAt: 'asc' }
  if (search.sort === 'top') orderBy = { voteScore: 'desc' }

  // Fetch listings
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        categoryId: category.id,
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        seller: {
          select: { username: true, isVerifiedSeller: true, sellerTier: true, githubVerifiedAt: true, githubUsername: true },
        },
        category: {
          select: { slug: true, name: true },
        },
      },
    }),
    prisma.listing.count({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        categoryId: category.id,
      },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="breadcrumbs mb-4">
        <Link href="/">Home</Link>
        <span>&gt;</span>
        <Link href="/listings">Listings</Link>
        <span>&gt;</span>
        <span>{category.name}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-accent-cyan">
          {getCategoryIcon(category.slug, 32)}
        </span>
        <div>
          <h1 className="font-display text-2xl">{category.name}</h1>
          {category.description && (
            <p className="text-text-muted text-sm">{category.description}</p>
          )}
        </div>
      </div>

      {/* Category navigation */}
      <CategoryNav categories={categories} />

      {/* Sort options */}
      <div className="my-6 flex items-center gap-4">
        <span className="text-sm text-text-muted">Sort:</span>
        <a
          href={`?sort=newest`}
          className={!search.sort || search.sort === 'newest' ? 'font-bold' : ''}
        >
          Newest
        </a>
        <a
          href={`?sort=top`}
          className={search.sort === 'top' ? 'font-bold' : ''}
        >
          Top Rated
        </a>
        <a
          href={`?sort=oldest`}
          className={search.sort === 'oldest' ? 'font-bold' : ''}
        >
          Oldest
        </a>
      </div>

      {/* Results */}
      <PaginatedListingGrid
        listings={listings}
        page={page}
        totalPages={totalPages}
        total={total}
        emptyMessage={`No ${category.name.toLowerCase()} projects listed yet.`}
      />
    </div>
  )
}
