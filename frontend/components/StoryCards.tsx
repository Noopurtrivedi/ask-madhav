'use client'

import { useEffect, useState } from 'react'
import { getStories } from '@/lib/api'
import type { Story } from '@/types'

/**
 * Card tints. Each story keeps its own hue so the row still reads as five
 * distinct cards, but they are now translucent washes over the cosmos rather
 * than opaque pastels — moonlight text on a pale card is unreadable, which is
 * exactly what happened when the page went dark.
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

  useEffect(() => {
    getStories()
      .then((r) => setStories(r.stories))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
            Stories from the Great War
          </h2>
          <p className="text-moonlight/58 mt-3 max-w-xl mx-auto text-sm">
            The Bhagavad Gita arose from this epic moment — a battlefield, a dilemma, and a divine
            conversation that changed the course of history.
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
          {stories.map((story, i) => (
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

              {/* Description */}
              <p className="text-moonlight/65 text-sm leading-relaxed mb-4">{story.description}</p>

              {/* Lesson */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-1">Lesson</p>
                <p className="text-moonlight/80 text-sm leading-relaxed">{story.moral}</p>
              </div>

              {/* Characters */}
              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
                {story.characters.map((c) => (
                  <span key={c} className="text-moonlight/34 text-xs">
                    #{c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
