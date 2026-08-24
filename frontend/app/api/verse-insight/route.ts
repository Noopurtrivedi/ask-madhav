import { NextRequest, NextResponse } from 'next/server'
import { getVerseInsight } from '@/lib/verseInsight'
import { checkRateLimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

/**
 * GET /api/verse-insight?ref=2.47 — the "Go deeper" endpoint.
 *
 * Insights are stable per verse, so responses are CDN-cached for a day (with a
 * long stale window): the whole site shares ~one generation per verse per day
 * per edge region, keeping the LLM cost of Daily Wisdom near zero. Follows the
 * /api/ask discipline — never hard-fails: the engine falls back to a
 * deterministic template built from the verse's own data.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
    if (!(await checkRateLimit(`insight:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests. Pause, breathe, try again.' }, { status: 429 })
    }

    const ref = (req.nextUrl.searchParams.get('ref') || '').trim().slice(0, 16)
    if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

    const insight = await getVerseInsight(ref)
    if (!insight) return NextResponse.json({ error: 'verse not found' }, { status: 404 })

    return NextResponse.json(insight, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err) {
    console.error('verse-insight error', err)
    return NextResponse.json({ error: 'The well is quiet for a moment. Try again.' }, { status: 500 })
  }
}
