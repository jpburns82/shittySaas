import Link from 'next/link'
import { Suspense } from 'react'
import { Nav } from './nav'
import { SearchBar } from '../search/search-bar'
import { APP_NAME, JP_ACCENTS } from '@/lib/constants'

function SearchBarFallback() {
  return (
    <div className="flex">
      <input
        type="search"
        placeholder="Search projects..."
        className="flex-1"
        disabled
      />
      <button type="button" className="btn ml-1" disabled>
        Go
      </button>
    </div>
  )
}

export function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <Link href="/" className="logo">
            <span className="text-text-dust text-sm jp-accent mr-1">{JP_ACCENTS.RESURRECTION}</span>
            {APP_NAME}
          </Link>

          {/* Search (desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
          </div>

          {/* Navigation */}
          <Nav />
        </div>

        {/* Search (mobile) */}
        <div className="md:hidden mt-2">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
