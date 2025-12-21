'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Category } from '@prisma/client'
import {
  LayoutGrid, Cloud, Smartphone, Puzzle, Zap, Package,
  Bot, Brain, FileText, Globe, Palette, Gamepad2,
  Users, Mail, MessageCircle, Folder
} from 'lucide-react'

const categoryIcons: Record<string, React.ReactNode> = {
  'all': <LayoutGrid size={16} />,
  'saas': <Cloud size={16} />,
  'mobile': <Smartphone size={16} />,
  'extensions': <Puzzle size={16} />,
  'apis': <Zap size={16} />,
  'boilerplates': <Package size={16} />,
  'scripts': <Bot size={16} />,
  'ai': <Brain size={16} />,
  'cms': <FileText size={16} />,
  'domains': <Globe size={16} />,
  'design': <Palette size={16} />,
  'games': <Gamepad2 size={16} />,
  'social-media': <Users size={16} />,
  'newsletters': <Mail size={16} />,
  'communities': <MessageCircle size={16} />,
  'other': <Folder size={16} />,
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
          {category.icon} {category.name}
        </option>
      ))}
    </select>
  )
}
