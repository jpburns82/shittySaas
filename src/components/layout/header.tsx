import Link from 'next/link'
import { Nav } from './nav'
import { SearchBar } from '../search/search-bar'

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
            <SearchBar />
          </div>

          {/* Navigation */}
          <Nav />
        </div>

        {/* Search (mobile) */}
        <div className="md:hidden mt-2">
          <SearchBar />
        </div>
      </div>
    </header>
  )
}
