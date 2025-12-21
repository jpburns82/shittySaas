'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select } from '../ui/select'
import type { Category } from '@prisma/client'

interface FiltersProps {
  categories: Category[]
}

export function Filters({ categories }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to first page
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Sort */}
      <Select
        label="Sort by"
        name="sort"
        value={searchParams.get('sort') || 'newest'}
        onChange={(e) => updateFilter('sort', e.target.value)}
        options={[
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'top', label: 'Top Rated' },
          { value: 'price_asc', label: 'Price: Low → High' },
          { value: 'price_desc', label: 'Price: High → Low' },
        ]}
      />

      {/* Category */}
      <Select
        label="Category"
        name="category"
        value={searchParams.get('category') || 'all'}
        onChange={(e) => updateFilter('category', e.target.value)}
        options={[
          { value: 'all', label: 'All Categories' },
          ...categories.map((c) => ({ value: c.slug, label: c.name })),
        ]}
      />

      {/* Price Type */}
      <Select
        label="Price"
        name="priceType"
        value={searchParams.get('priceType') || 'all'}
        onChange={(e) => updateFilter('priceType', e.target.value)}
        options={[
          { value: 'all', label: 'All Prices' },
          { value: 'FREE', label: 'Free Only' },
          { value: 'FIXED', label: 'Paid Only' },
          { value: 'PAY_WHAT_YOU_WANT', label: 'Pay What You Want' },
        ]}
      />
    </div>
  )
}

// Active filters display
export function ActiveFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters: Array<{ key: string; label: string }> = []

  const query = searchParams.get('q')
  if (query) {
    filters.push({ key: 'q', label: `"${query}"` })
  }

  const category = searchParams.get('category')
  if (category && category !== 'all') {
    filters.push({ key: 'category', label: category })
  }

  const priceType = searchParams.get('priceType')
  if (priceType && priceType !== 'all') {
    filters.push({ key: 'priceType', label: priceType.replace('_', ' ').toLowerCase() })
  }

  if (filters.length === 0) return null

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`?${params.toString()}`)
  }

  const clearAll = () => {
    router.push('/listings')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <span className="text-text-muted">Filters:</span>
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => removeFilter(key)}
          className="badge flex items-center gap-1 hover:bg-bg-accent"
        >
          {label}
          <span className="text-text-muted">×</span>
        </button>
      ))}
      <button onClick={clearAll} className="btn-link text-xs">
        Clear all
      </button>
    </div>
  )
}
