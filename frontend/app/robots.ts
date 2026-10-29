import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.askmadhav.world'

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/og stays crawlable: social crawlers (X obeys robots.txt) fetch share images there.
    rules: [{ userAgent: '*', allow: ['/', '/api/og'], disallow: ['/api/'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
