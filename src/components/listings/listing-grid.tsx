import { ListingCard } from './listing-card'
import { ListingGridSkeleton } from '../ui/spinner'
import type { ListingCard as ListingCardType } from '@/types/listing'

interface ListingGridProps {
  listings: ListingCardType[]
  loading?: boolean
  emptyMessage?: string
}

export function ListingGrid({ listings, loading, emptyMessage = 'No listings found.' }: ListingGridProps) {
  if (loading) {
    return <ListingGridSkeleton />
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="font-display text-xl mb-2">¯\_(ツ)_/¯</p>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

// With pagination info
interface PaginatedListingGridProps extends ListingGridProps {
  page: number
  totalPages: number
  total: number
}

export function PaginatedListingGrid({
  listings,
  loading,
  emptyMessage,
  page,
  totalPages,
  total,
}: PaginatedListingGridProps) {
  return (
    <div>
      {/* Results count */}
      <div className="text-sm text-text-muted mb-4">
        Showing {listings.length} of {total} listings
        {totalPages > 1 && ` (page ${page} of ${totalPages})`}
      </div>

      {/* Grid */}
      <ListingGrid listings={listings} loading={loading} emptyMessage={emptyMessage} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  )
}

// Simple pagination component
function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pages = []
  const maxVisible = 5

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      {currentPage > 1 && (
        <a href={`?page=${currentPage - 1}`}>← Prev</a>
      )}

      {start > 1 && (
        <>
          <a href="?page=1">1</a>
          {start > 2 && <span>...</span>}
        </>
      )}

      {pages.map((pageNum) => (
        <a
          key={pageNum}
          href={`?page=${pageNum}`}
          className={pageNum === currentPage ? 'current' : ''}
          aria-current={pageNum === currentPage ? 'page' : undefined}
        >
          {pageNum}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span>...</span>}
          <a href={`?page=${totalPages}`}>{totalPages}</a>
        </>
      )}

      {currentPage < totalPages && (
        <a href={`?page=${currentPage + 1}`}>Next →</a>
      )}
    </nav>
  )
}
