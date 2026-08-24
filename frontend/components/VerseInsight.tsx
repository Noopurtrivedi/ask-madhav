'use client'

/**
 * VerseInsight — the expandable "Go deeper" study panel for one verse.
 *
 * Fetches /api/verse-insight lazily on first open (so Daily Wisdom costs
 * nothing for seekers who don't expand it) and renders the five-part
 * deep-dive: essence → context → modern mirror → practice → reflection.
 * Used by DailyVerse and the /verse/[reference] page.
 */

import { useState } from 'react'

interface Insight {
  source: 'ai' | 'template'
  essence: string
  context: string
  analogy: string
  practice: string
  reflection: string
}

const SECTIONS: { key: keyof Insight; label: string }[] = [
  { key: 'essence', label: 'The Essence' },
  { key: 'context', label: 'In the Dialogue' },
  { key: 'analogy', label: 'A Modern Mirror' },
  { key: 'practice', label: 'Practice Today' },
  { key: 'reflection', label: 'Sit With This' },
]

export default function VerseInsight({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/verse-insight?ref=${encodeURIComponent(reference)}`)
      if (!res.ok) throw new Error('failed')
      setInsight((await res.json()) as Insight)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !insight && !loading) load()
  }

  return (
    <div className="mt-4 rounded-2xl border border-gold/16 bg-white/[0.035] p-4 text-left">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-[11px] uppercase tracking-[0.15em] text-gold-soft/70">
            Go deeper
          </span>
          <span className="mt-1 block text-sm text-moonlight/82">
            Study this shloka — its essence, its moment, a modern mirror, and one practice.
          </span>
        </span>
        <span className={`text-gold-soft/60 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="fade-up mt-4 space-y-4 border-t border-gold/12 pt-4">
          {loading && (
            <div className="space-y-3" aria-label="Preparing the deep dive">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-moonlight/58">
              The deep dive would not open just now.{' '}
              <button type="button" onClick={load} className="text-gold-soft hover:text-saffron underline underline-offset-2">
                Try again
              </button>
            </p>
          )}

          {insight && !loading && (
            <>
              {SECTIONS.map(({ key, label }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-[0.15em] text-gold-soft/75">{label}</p>
                  <p
                    className={`text-sm leading-relaxed ${
                      key === 'reflection' ? 'italic text-moonlight/85' : 'text-moonlight/76'
                    }`}
                  >
                    {insight[key]}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
