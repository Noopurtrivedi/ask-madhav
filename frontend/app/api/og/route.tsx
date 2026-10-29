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

// ── Brand ────────────────────────────────────────────────────────
// Same "Midnight & Gold Leaf" language as the site: Playfair for the words,
// DM Sans caps for labels, Cinzel for the wordmark, gold hairlines on a midnight sky.
const MOON = '#F6F1E4'
const GOLD = '#E3B65C'
const GOLD_SOFT = 'rgba(232,195,90,0.75)'
const SKY =
  'radial-gradient(900px 520px at 88% 0%, rgba(227,182,92,0.20), transparent 60%), radial-gradient(800px 600px at 0% 100%, rgba(70,44,128,0.45), transparent 60%), linear-gradient(160deg, #05070F 0%, #0A0E2A 55%, #131A3E 100%)'

type Weight = 400 | 500 | 600 | 700
type OgFont = { name: string; data: ArrayBuffer; weight: Weight; style: 'normal' | 'italic' }

/**
 * Satori needs raw TTF data. Google serves TTF to a non-browser user agent, so
 * the fonts are fetched once per server instance and memoised. Any failure
 * resolves to [] — the card then renders in the default serif rather than 500.
 */
async function loadGoogleFont(family: string, weight: Weight, italic: boolean): Promise<ArrayBuffer | null> {
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}`).then((r) => r.text())
  const url = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)?.[1]
  return url ? fetch(url).then((r) => r.arrayBuffer()) : null
}

const FONT_SPECS: { family: string; name: string; weight: Weight; style: 'normal' | 'italic' }[] = [
  { family: 'Playfair Display', name: 'Playfair', weight: 600, style: 'normal' },
  { family: 'Playfair Display', name: 'Playfair', weight: 500, style: 'italic' },
  { family: 'DM Sans', name: 'DM Sans', weight: 700, style: 'normal' },
  { family: 'Cinzel', name: 'Cinzel', weight: 600, style: 'normal' },
]

let fontsPromise: Promise<OgFont[]> | null = null
function brandFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_SPECS.map(async ({ family, name, weight, style }): Promise<OgFont | null> => {
        const data = await loadGoogleFont(family, weight, style === 'italic')
        return data ? { name, data, weight, style } : null
      }),
    )
      .then((fonts) => fonts.filter((f): f is OgFont => f !== null))
      .catch(() => {
        fontsPromise = null // try again on the next request
        return []
      })
  }
  return fontsPromise
}

/** The Sudarshan Chakra mark, drawn — eight spokes in a double ring. */
function Chakra({ size = 40 }: { size?: number }) {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    return (
      <line key={i} x1={20 + Math.cos(a) * 5} y1={20 + Math.sin(a) * 5} x2={20 + Math.cos(a) * 15} y2={20 + Math.sin(a) * 15} stroke={GOLD} strokeWidth="1.4" />
    )
  })
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke={GOLD} strokeWidth="1.4" />
      <circle cx="20" cy="20" r="15" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
      {spokes}
      <circle cx="20" cy="20" r="3.2" fill={GOLD} />
    </svg>
  )
}

/** Frame shared by every card: sky, hairline border, brand row, footer rule. */
function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: SKY, padding: 28, fontFamily: 'Playfair, serif' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(232,195,90,0.32)',
          borderRadius: 18,
          padding: '44px 56px 38px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Chakra />
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: 25, letterSpacing: 7, color: MOON }}>ASK MADHAV</div>
          <div style={{ marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 4, color: GOLD }}>
            {label}
          </div>
        </div>

        {children}

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(232,195,90,0.55))' }} />
          <div style={{ display: 'flex', width: 9, height: 9, background: GOLD, transform: 'rotate(45deg)' }} />
          <div style={{ display: 'flex', flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(232,195,90,0.55), transparent)' }} />
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: 4, color: 'rgba(246,241,228,0.6)' }}>
            ASKMADHAV.WORLD
          </div>
        </div>
      </div>
    </div>
  )
}

/** Shrink long lines so a card never overflows. */
function quoteSize(text: string): number {
  if (text.length > 170) return 40
  if (text.length > 110) return 48
  return 58
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fonts = await brandFonts()
    // A free-form quote (e.g. Madhav's one-line truth from a conversation) gets
    // its own card; otherwise fall back to the verse card.
    const quote = searchParams.get('quote')
    if (quote) return renderQuoteCard(quote, searchParams.get('q'), fonts)
    return renderCard(req, fonts)
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
            background: '#0A0E2A',
            color: GOLD,
            fontSize: 64,
            letterSpacing: 12,
            fontFamily: 'serif',
          }}
        >
          ASK MADHAV
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }
}

// A shareable card carrying a line of guidance — the most viral artifact the
// app can produce. Optionally shows the question that prompted it.
function renderQuoteCard(quote: string, question: string | null, fonts: OgFont[]) {
  const line = clip(quote, 220)
  return new ImageResponse(
    (
      <Frame label="WORDS FROM MADHAV">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {question && (
            <div style={{ display: 'flex', fontSize: 26, color: 'rgba(246,241,228,0.5)', fontStyle: 'italic' }}>
              {`You asked: “${clip(question, 90)}”`}
            </div>
          )}
          <div style={{ display: 'flex', fontSize: quoteSize(line), fontStyle: 'italic', color: MOON, lineHeight: 1.2 }}>
            {`“${line}”`}
          </div>
        </div>
      </Frame>
    ),
    { width: 1200, height: 630, fonts },
  )
}

function renderCard(req: Request, fonts: OgFont[]) {
  const { searchParams } = new URL(req.url)
  const verse = pickVerse(searchParams.get('ref'))
  const meaning = clip(verse.english_meaning, 200)

  return new ImageResponse(
    (
      <Frame label={`BHAGAVAD GITA ${verse.reference}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: quoteSize(meaning), fontStyle: 'italic', color: MOON, lineHeight: 1.2 }}>
            {`“${meaning}”`}
          </div>
          <div style={{ display: 'flex', fontSize: 25, fontStyle: 'italic', color: GOLD_SOFT }}>
            {clip(verse.transliteration, 120)}
          </div>
        </div>
      </Frame>
    ),
    { width: 1200, height: 630, fonts },
  )
}
