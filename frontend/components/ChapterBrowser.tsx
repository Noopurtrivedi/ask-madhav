'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHAPTERS } from '@/lib/chapters'

function askMadhav(question: string) {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function ChapterBrowser() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="chapters" className="py-20 sm:py-28 px-6" >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-5">
            18 Chapters · 700 Verses
          </p>
          <h2
            className="section-title mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            The eighteen <em className="gold-leaf">yogas</em>
          </h2>
          <p className="section-lede max-w-lg mx-auto">
            Each chapter is a complete yoga, a path. Tap one for its essence, or read it verse by verse.
          </p>
          <Link href="/gita" className="btn-ghost mt-6 inline-flex px-6 py-3 text-xs">
            Open the full Gita
          </Link>
        </div>

        {/* Chapter grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
          {CHAPTERS.map((ch) => {
            const isOpen = open === ch.n
            return (
              <div
                key={ch.n}
                className={`group rounded-xl border bg-white/[0.02]
                  transition-all duration-300 ${
                    isOpen ? 'border-gold/40 shadow-lg shadow-saffron/10' : 'border-gold/15 hover:border-saffron/35'
                  }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : ch.n)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="gold-leaf font-display text-[2.6rem] font-semibold leading-none opacity-90"
                      style={{ fontFamily: 'var(--font-display), serif' }}
                    >
                      {ch.n}
                    </span>
                    <span className="font-sans font-bold text-[0.6rem] tracking-[0.2em] uppercase text-moonlight/40 mt-1">{ch.verses} verses</span>
                  </div>
                  <p
                    className="text-moonlight/90 text-lg font-semibold mb-0.5 group-hover:text-gold-soft transition-colors leading-snug"
                    style={{ fontFamily: 'var(--font-display), serif' }}
                  >
                    {ch.yoga}
                  </p>
                  <p className="text-moonlight/48 text-xs flex items-center justify-between">
                    {ch.short}
                    <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </p>
                </button>

                {/* Expanding essence panel */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gold/15">
                      <p className="text-moonlight/75 text-sm leading-relaxed">{ch.summary}</p>
                      <div className="grid gap-2 text-xs text-moonlight/58 sm:grid-cols-2">
                        <p className="rounded-lg border border-gold/12 bg-white/[0.035] p-3">
                          <span className="block text-gold-soft/70">Study scope</span>
                          {ch.verses} verses to explore, from the chapter&apos;s crisis to its practice.
                        </p>
                        <p className="rounded-lg border border-gold/12 bg-white/[0.035] p-3">
                          <span className="block text-gold-soft/70">Modern analogy</span>
                          Ask Madhav to translate this yoga into work, family, friendship, duty, and inner conflict.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                      <Link href={`/gita/${ch.n}`} className="btn-leaf px-4 py-2 text-[0.68rem]">
                        Read this chapter
                      </Link>
                      <button
                        onClick={() =>
                          askMadhav(`Tell me the essence of Chapter ${ch.n} of the Bhagavad Gita — ${ch.yoga} — and how it applies to my life.`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                   border border-gold/35 text-saffron hover:bg-gold-soft/[0.10] transition-colors"
                      >
                        Ask Madhav about it
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
