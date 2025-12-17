import Link from 'next/link'
import { Suspense } from 'react'
import { Nav } from './nav'
import { SearchBar } from '../search/search-bar'

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
            SideProject.deals
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
