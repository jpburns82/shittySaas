import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Providers } from '@/components/providers'
import { SEO, APP_NAME, APP_URL } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: SEO.DEFAULT_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: SEO.DEFAULT_DESCRIPTION,
  openGraph: {
    title: SEO.DEFAULT_TITLE,
    description: SEO.DEFAULT_DESCRIPTION,
    type: 'website',
    images: [SEO.OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.DEFAULT_TITLE,
    description: SEO.DEFAULT_DESCRIPTION,
    images: [SEO.OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-bg-crypt text-text-bone">
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
