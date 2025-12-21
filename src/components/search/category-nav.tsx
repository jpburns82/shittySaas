'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Category } from '@prisma/client'
import {
  LayoutGrid, Cloud, Smartphone, Puzzle, Zap, Package,
  Bot, Brain, FileText, Globe, Palette, Gamepad2,
  Users, Mail, MessageCircle, Folder, Bitcoin, Gem, TrendingUp,
  Monitor, Server, Terminal, FolderCode
} from 'lucide-react'

// Icon components by category slug (for use with getCategoryIcon helper)
const categoryIconComponents: Record<string, typeof Folder> = {
  'all': LayoutGrid,
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

// Pre-rendered icons at size 16 for navigation
export const categoryIcons: Record<string, React.ReactNode> = Object.fromEntries(
  Object.entries(categoryIconComponents).map(([slug, Icon]) => [slug, <Icon key={slug} size={16} />])
)

// Helper to get category icon at any size
export function getCategoryIcon(slug: string, size: number = 16): React.ReactNode {
  const Icon = categoryIconComponents[slug] || Folder
  return <Icon size={size} />
}

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
        <span className="inline-flex items-center gap-1.5">
          <span className={cn(!currentCategory ? 'text-accent-electric' : 'text-text-muted')}>
            {categoryIcons['all']}
          </span>
          All
        </span>
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/listings?category=${category.slug}`}
          className={cn(currentCategory === category.slug && 'active')}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className={cn(currentCategory === category.slug ? 'text-accent-electric' : 'text-text-muted')}>
              {categoryIcons[category.slug] || <Folder size={16} />}
            </span>
            {category.name}
          </span>
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
          {category.name}
        </option>
      ))}
    </select>
  )
}
