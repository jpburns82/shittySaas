'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ListingCard, ListingFilters } from '@/types/listing'
import type { PaginatedResponse } from '@/types/api'

interface UseListingsOptions {
  initialFilters?: ListingFilters
  autoFetch?: boolean
}

interface UseListingsReturn {
  listings: ListingCard[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  filters: ListingFilters
  setFilters: (filters: Partial<ListingFilters>) => void
  fetchListings: () => Promise<void>
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
}

const defaultFilters: ListingFilters = {
  category: undefined,
  priceType: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  sort: 'newest',
  search: undefined,
}

export function useListings(options: UseListingsOptions = {}): UseListingsReturn {
  const { initialFilters = {}, autoFetch = true } = options

  const [listings, setListings] = useState<ListingCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [filters, setFiltersState] = useState<ListingFilters>({
    ...defaultFilters,
    ...initialFilters,
  })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())

      if (filters.category) params.set('category', filters.category)
      if (filters.priceType) params.set('priceType', filters.priceType)
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.search) params.set('q', filters.search)

      const res = await fetch(`/api/listings?${params}`)
      const data: PaginatedResponse<ListingCard> = await res.json()

      if (data.success && data.data) {
        setListings(data.data)
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total,
          })
        }
      } else {
        setError(data.error || 'Failed to fetch listings')
      }
    } catch {
      setError('Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters])

  const setFilters = useCallback((newFilters: Partial<ListingFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to page 1
  }, [])

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination.page, pagination.totalPages])

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
    }
  }, [pagination.page])

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setPagination((prev) => ({ ...prev, page }))
      }
    },
    [pagination.totalPages]
  )

  useEffect(() => {
    if (autoFetch) {
      fetchListings()
    }
  }, [fetchListings, autoFetch])

  return {
    listings,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchListings,
    nextPage,
    prevPage,
    goToPage,
  }
}

// Hook for a single listing
export function useListing(id: string) {
  const [listing, setListing] = useState<ListingCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListing() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/listings/${id}`)
        const data = await res.json()

        if (data.success) {
          setListing(data.data)
        } else {
          setError(data.error || 'Failed to fetch listing')
        }
      } catch {
        setError('Failed to fetch listing')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  return { listing, loading, error }
}
