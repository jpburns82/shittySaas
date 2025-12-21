import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, APP_TAGLINE, JP_ACCENTS, EXTERNAL_LINKS } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Footer Badge Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/undeadlist_footer_badge_transparent.png"
            alt="UndeadList"
            width={128}
            height={128}
            className="w-32 h-32"
          />
        </div>
        {/* Links */}
        <div className="footer-links">
          <Link href="/listings">Browse</Link>
          <Link href="/sell">Sell</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>

        {/* Social links */}
        <div className="footer-links mb-4">
          <a href={EXTERNAL_LINKS.TWITTER} target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href={EXTERNAL_LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>

        {/* Copyright */}
        <div className="footer-copy">
          <p className="jp-accent text-text-dust text-sm mb-1">{JP_ACCENTS.MARKET_OF_DEAD}</p>
          <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
          <p className="text-xs mt-1">
            {APP_TAGLINE}. All sales final.
          </p>
        </div>
      </div>
    </footer>
  )
}
