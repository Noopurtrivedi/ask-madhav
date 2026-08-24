'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStories } from '@/lib/api'
import { useTTS } from '@/lib/useTTS'
import type { Story } from '@/types'

/**
 * StoryCards — Mahabharata stories, fully told.
 *
 * Each card expands into the full narration (data/stories.json carries a
 * hand-written retelling per story), the moral, a "what to carry" lesson, and
 * the Gita verses that anchor the teaching. "Hear the story" narrates the full
 * retelling in Madhav's server voice (the same calm Gemini TTS voice as the
 * chat, via lib/useTTS — browser voice fallback). When something in a story
 * feels unfair, one tap hands the tension to Madhav in the chat.
 */

const STORY_BG = [
  'linear-gradient(160deg, rgba(124,92,168,0.20), rgba(255,255,255,0.035))',
  'linear-gradient(160deg, rgba(72,116,180,0.20), rgba(255,255,255,0.035))',
  'linear-gradient(160deg, rgba(72,150,110,0.18), rgba(255,255,255,0.035))',
  'linear-gradient(160deg, rgba(196,132,52,0.18), rgba(255,255,255,0.035))',
  'linear-gradient(160deg, rgba(56,150,150,0.18), rgba(255,255,255,0.035))',
]

const STORY_ICONS = ['⚔️', '🏹', '👑', '🌺', '🪷']

export default function StoryCards() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<number | null>(null)
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const { speak, stop, state } = useTTS()

  useEffect(() => {
    getStories()
      .then((r) => setStories(r.stories))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // The hook resets to idle when playback ends — clear the per-card marker too.
  useEffect(() => {
    if (state === 'idle') setSpeakingId(null)
  }, [state])

  const askAboutFairness = (story: Story) => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
    window.dispatchEvent(
      new CustomEvent('madhav:prefill', {
        detail: {
          question: `In the story "${story.title}", something feels unfair to me. Explain it as Madhav would to Parth, using Bhagavad Gita shlokas and a modern analogy.`,
        },
      }),
    )
  }

  const narrate = (story: Story) => {
    if (speakingId === story.id) {
      stop()
      setSpeakingId(null)
      return
    }
    // Narrate the full retelling, closing on the moral — one flowing telling.
    const text = `${story.title}. ${story.narration || story.description} The moral: ${story.moral}`
    setSpeakingId(story.id)
    setOpen(story.id) // hearing and reading travel together
    speak(text, 'english')
  }

  return (
    <section id="stories" className="py-14 sm:py-20 px-6" >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-gold-soft/75 text-xs tracking-[0.3em] uppercase mb-2">Mahabharata</p>
          <h2
            className="text-4xl font-bold text-moonlight"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Stories and Their Lessons
          </h2>
          <p className="text-moonlight/58 mt-3 max-w-xl mx-auto text-sm">
            Hear each story told in full, take its lesson, and when a moment feels unfair — ask Madhav.
          </p>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gold/18 rounded-2xl p-6 space-y-4">
                <div className="skeleton h-10 w-10 rounded-lg" />
                <div className="skeleton h-5 w-14 rounded-full" />
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Story grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, i) => {
            const isOpen = open === story.id
            const isSpeaking = speakingId === story.id
            return (
              <div
                key={story.id}
              className="border border-gold/22 rounded-2xl p-6 backdrop-blur-sm hover:border-gold/40
                         transition-all hover:-translate-y-1 cursor-default"
              style={{ background: STORY_BG[i % STORY_BG.length] }}
            >
              {/* Icon */}
              <div className="text-4xl mb-4 select-none">{STORY_ICONS[i % STORY_ICONS.length]}</div>

              {/* Chapter badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs rounded-full">
                  Ch. {story.chapter_reference}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-moonlight text-xl font-semibold mb-3 leading-snug"
                style={{ fontFamily: 'Crimson Text, serif' }}
              >
                {story.title}
              </h3>

              {/* Description — the short telling; the full narration lives in the expansion */}
              {!isOpen && (
                <p className="text-moonlight/65 text-sm leading-relaxed mb-4">{story.description}</p>
              )}

              {isOpen && story.narration && (
                <div className="fade-up mb-4 space-y-3">
                  {story.narration.split('\n\n').map((para, p) => (
                    <p key={p} className="text-moonlight/72 text-sm leading-relaxed">{para}</p>
                  ))}
                </div>
              )}

              {/* Moral */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-1">The Moral</p>
                <p className="text-moonlight/80 text-sm leading-relaxed">{story.moral}</p>
              </div>

              {isOpen && (
                <div className="fade-up mt-4 space-y-4 rounded-xl border border-gold/16 bg-white/[0.04] p-4">
                  {story.lesson && (
                    <div>
                      <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-1">What to Carry</p>
                      <p className="text-moonlight/72 text-sm leading-relaxed">{story.lesson}</p>
                    </div>
                  )}
                  {story.gita_refs && story.gita_refs.length > 0 && (
                    <div>
                      <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-2">In the Gita</p>
                      <ul className="space-y-2">
                        {story.gita_refs.map((g) => (
                          <li key={g.ref} className="text-sm leading-relaxed text-moonlight/72">
                            <Link
                              href={`/verse/${g.ref}`}
                              className="mr-2 inline-block rounded-full border border-gold/30 px-2 py-0.5 text-xs text-gold-soft hover:border-gold hover:bg-gold-soft/[0.08] transition-colors"
                            >
                              BG {g.ref}
                            </Link>
                            {g.line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Characters */}
              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
                {story.characters.map((c) => (
                  <span key={c} className="text-moonlight/34 text-xs">
                    #{c}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : story.id)}
                  className="rounded-full border border-gold/30 px-3 py-1.5 text-xs text-gold-soft hover:border-gold hover:bg-gold-soft/[0.08] transition-colors"
                >
                  {isOpen ? 'Close the story' : 'Read the full story'}
                </button>
                <button
                  type="button"
                  onClick={() => narrate(story)}
                  className="rounded-full border border-gold/24 px-3 py-1.5 text-xs text-moonlight/68 hover:border-gold/40 hover:text-gold-soft transition-colors"
                >
                  {isSpeaking && state === 'preparing'
                    ? 'Preparing…'
                    : isSpeaking
                      ? '■ Stop narration'
                      : '▶ Hear the story'}
                </button>
                <button
                  type="button"
                  onClick={() => askAboutFairness(story)}
                  className="rounded-full border border-gold/24 px-3 py-1.5 text-xs text-moonlight/68 hover:border-gold/40 hover:text-gold-soft transition-colors"
                >
                  Ask why this was fair →
                </button>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
