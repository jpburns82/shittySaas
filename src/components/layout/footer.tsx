import Link from 'next/link'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Links */}
        <div className="footer-links">
          <Link href="/listings">Browse</Link>
          <Link href="/sell">Sell</Link>
          <Link href="/about">About</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>

        {/* Social links */}
        <div className="footer-links mb-4">
          <a href="https://twitter.com/sideprojectdeals" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href="https://github.com/sideprojectdeals" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>

        {/* Copyright */}
        <div className="footer-copy">
          <p>&copy; {new Date().getFullYear()} SideProject.deals</p>
          <p className="text-xs mt-1">
            The flea market for software. All sales final.
          </p>
        </div>
      </div>
    </footer>
  )
}
