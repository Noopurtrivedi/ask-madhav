import type { MetadataRoute } from 'next'
import { STORIES, VERSES } from '@/lib/verseEngine'
import { CHAPTERS } from '@/lib/chapters'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.askmadhav.world'

/**
 * Every verse is its own landing page (/verse/2.47) — listing all 701 lets
 * search engines find the one a seeker is actually looking for.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/gita`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/find`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/journal`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/stories`, changeFrequency: 'monthly', priority: 0.8 },
    ...STORIES.map((s) => ({ url: `${SITE}/stories/${s.slug}`, changeFrequency: 'yearly' as const, priority: 0.7 })),
    ...CHAPTERS.map((c) => ({ url: `${SITE}/gita/${c.n}`, changeFrequency: 'yearly' as const, priority: 0.8 })),
    ...VERSES.map((v) => ({
      url: `${SITE}/verse/${v.reference}`,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ]
}
