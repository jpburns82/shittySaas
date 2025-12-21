import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://undeadlist.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/sell/',
          '/download/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
