import { ImageResponse } from 'next/og'
import verses from '@/data/verses.json'

// Node runtime (not edge): this route statically imports the full 701-verse
// dataset (~2 MB), which exceeds the Hobby plan's 1 MB Edge Function limit.
// next/og's ImageResponse runs fine on Node, where the size limit is 250 MB.
export const runtime = 'nodejs'
// Always rendered on demand (reads ?ref from the request URL); skip static prerender.
export const dynamic = 'force-dynamic'

interface OgVerse {
  reference: string
  chapter_number: number
  verse_number: number
  transliteration: string
  english_meaning: string
}

// Day-of-year fallback so a card without ?ref still works.
function pickVerse(ref: string | null): OgVerse {
  const all = verses as OgVerse[]
  if (ref) {
    const found = all.find((v) => v.reference === ref)
    if (found) return found
  }
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 0)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const day = Math.floor((today - start) / 86400000)
  return all[day % all.length]
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    // A free-form quote (e.g. Madhav's one-line truth from a conversation) gets
    // its own card; otherwise fall back to the verse card.
    const quote = searchParams.get('quote')
    if (quote) return renderQuoteCard(quote, searchParams.get('q'))
    return renderCard(req)
  } catch (err) {
    console.error('og render error', err)
    // Minimal branded fallback so a share link never returns a 500.
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0A0F2E',
            color: '#E8A620',
            fontSize: 64,
            fontFamily: 'serif',
          }}
        >
          🪷 Ask Madhav
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }
}

// A shareable card carrying a line of guidance — the most viral artifact the
// app can produce. Optionally shows the question that prompted it.
function renderQuoteCard(quote: string, question: string | null) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px',
          background: 'linear-gradient(160deg, #050A1E 0%, #0A0F2E 55%, #111827 100%)',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: 44 }}>🪷</div>
          <div style={{ fontSize: 30, color: '#E8A620', letterSpacing: 2 }}>Ask Madhav</div>
          {question && (
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 22,
                color: 'rgba(255,248,231,0.55)',
                fontStyle: 'italic',
                maxWidth: 520,
                textAlign: 'right',
              }}
            >
              {`“${clip(question, 80)}”`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', fontSize: 48, color: '#FFF8E7', lineHeight: 1.35 }}>
          {`“${clip(quote, 220)}”`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: 'rgba(255,248,231,0.4)' }}>
          <div style={{ display: 'flex' }}>Guidance inspired by the Bhagavad Gita</div>
          <div style={{ marginLeft: 'auto', color: '#E8A620' }}>Seek wisdom. Find peace.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

function renderCard(req: Request) {
  const { searchParams } = new URL(req.url)
  const verse = pickVerse(searchParams.get('ref'))
  const meaning =
    verse.english_meaning.length > 200
      ? verse.english_meaning.slice(0, 197).trimEnd() + '…'
      : verse.english_meaning

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px',
          background: 'linear-gradient(160deg, #050A1E 0%, #0A0F2E 55%, #111827 100%)',
          fontFamily: 'serif',
        }}
      >
        {/* top brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: 44 }}>🪷</div>
          <div style={{ fontSize: 30, color: '#E8A620', letterSpacing: 2 }}>Ask Madhav</div>
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 24,
              color: '#E8A620',
              background: 'rgba(232,166,32,0.15)',
              border: '1px solid rgba(232,166,32,0.4)',
              borderRadius: 999,
              padding: '8px 22px',
            }}
          >
            {`Chapter ${verse.chapter_number} · Verse ${verse.verse_number}`}
          </div>
        </div>

        {/* meaning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: 46, color: '#FFF8E7', lineHeight: 1.3 }}>{`“${meaning}”`}</div>
          <div style={{ fontSize: 26, color: 'rgba(255,248,231,0.55)', fontStyle: 'italic' }}>
            {verse.transliteration.length > 130
              ? verse.transliteration.slice(0, 127) + '…'
              : verse.transliteration}
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: 'rgba(255,248,231,0.4)' }}>
          <div style={{ display: 'flex' }}>{`Bhagavad Gita ${verse.reference}`}</div>
          <div style={{ marginLeft: 'auto', color: '#E8A620' }}>Seek wisdom. Find peace.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
