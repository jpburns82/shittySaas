'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select } from '../ui/select'
import type { Category } from '@prisma/client'
import {
  Cloud, Smartphone, Puzzle,
  Brain, FileText, Globe, Palette, Gamepad2,
  Users, Mail, MessageCircle, Folder, Monitor,
  Server, Terminal, Bitcoin, Gem, TrendingUp, FolderCode, LayoutGrid
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Map category slugs to Lucide icons
const categoryIconMap: Record<string, LucideIcon> = {
  'saas': Cloud,
  'desktop': Monitor,
  'mobile': Smartphone,
  'extensions': Puzzle,
  'apis': Server,
  'boilerplates': FolderCode,
  'scripts': Terminal,
  'ai': Brain,
  'cms': FileText,
  'domains': Globe,
  'design': Palette,
  'games': Gamepad2,
  'social-media': Users,
  'newsletters': Mail,
  'communities': MessageCircle,
  'crypto': Bitcoin,
  'nft': Gem,
  'defi': TrendingUp,
  'other': Folder,
}

// Helper to get icon component for a category
function getCategoryIcon(slug: string, size: number = 16) {
  const IconComponent = categoryIconMap[slug] || Folder
  return <IconComponent size={size} className="text-text-muted" />
}

// Custom CategoryFilterDropdown with Lucide icons
interface CategoryFilterDropdownProps {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}

function CategoryFilterDropdown({ categories, value, onChange }: CategoryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedCategory = value === 'all' ? null : categories.find(c => c.slug === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1.5">Category</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[160px] px-3 py-2 bg-bg-grave border border-border-dark rounded text-left flex items-center gap-2 hover:border-border-light transition-colors text-sm"
      >
        {selectedCategory ? (
          <>
            {getCategoryIcon(selectedCategory.slug)}
            <span>{selectedCategory.name}</span>
          </>
        ) : (
          <>
            <LayoutGrid size={16} className="text-text-muted" />
            <span>All Categories</span>
          </>
        )}
        <span className="ml-auto text-text-muted">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-border-dark rounded shadow-lg max-h-60 overflow-auto">
          <button
            type="button"
            onClick={() => {
              onChange('all')
              setIsOpen(false)
            }}
            className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-bg-tombstone transition-colors text-sm ${value === 'all' ? 'bg-bg-tombstone' : ''}`}
          >
            <LayoutGrid size={16} className="text-text-muted" />
            <span>All Categories</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onChange(category.slug)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-bg-tombstone transition-colors text-sm ${value === category.slug ? 'bg-bg-tombstone' : ''}`}
            >
              {getCategoryIcon(category.slug)}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
      <CategoryFilterDropdown
        categories={categories}
        value={searchParams.get('category') || 'all'}
        onChange={(value) => updateFilter('category', value)}
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
