'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Category } from '@prisma/client'

interface CategoryNavProps {
  categories: Category[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  return (
    <nav className="category-nav" aria-label="Categories">
      <Link
        href="/listings"
        className={cn(!currentCategory && 'active')}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/listings?category=${category.slug}`}
          className={cn(currentCategory === category.slug && 'active')}
        >
          {category.icon} {category.name}
        </Link>
      ))}
    </nav>
  )
}

// Compact version for mobile
export function CategorySelect({ categories }: CategoryNavProps) {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') || ''

  return (
    <select
      value={currentCategory}
      onChange={(e) => {
        const url = e.target.value
          ? `/listings?category=${e.target.value}`
          : '/listings'
        window.location.href = url
      }}
      className="w-full"
      aria-label="Select category"
    >
      <option value="">All Categories</option>
      {categories.map((category) => (
        <option key={category.id} value={category.slug}>
          {category.icon} {category.name}
        </option>
      ))}
    </select>
  )
}
