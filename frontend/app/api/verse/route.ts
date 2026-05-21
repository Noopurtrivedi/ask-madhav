import { NextRequest, NextResponse } from 'next/server'
import { findVerse } from '@/lib/verseEngine'

export const runtime = 'nodejs'

// GET /api/verse?ref=2.47           → { verse }
// GET /api/verse?refs=2.47,2.20,4.7 → { verses: [...] }  (preserves order, drops misses)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const refs = searchParams.get('refs')
  const ref = searchParams.get('ref')

  if (refs) {
    const verses = refs
      .split(',')
      .map((r) => findVerse(r.trim()))
      .filter(Boolean)
    return NextResponse.json({ verses })
  }

  if (ref) {
    const verse = findVerse(ref.trim())
    if (!verse) return NextResponse.json({ error: 'Verse not found' }, { status: 404 })
    return NextResponse.json({ verse })
  }

  return NextResponse.json({ error: 'Provide ?ref= or ?refs=' }, { status: 400 })
}
