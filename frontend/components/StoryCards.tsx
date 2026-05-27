'use client'

import { useEffect, useState } from 'react'
import { getStories } from '@/lib/api'
import type { Story } from '@/types'

const STORY_BG = [
  '#F6EEFF',
  '#EAF1FF',
  '#ECF8EC',
  '#FFF1E2',
  '#E9F8F3',
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
    <section id="stories" className="py-14 sm:py-20 px-6" style={{ background: '#FBF4E6' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Mahabharata</p>
          <h2
            className="text-4xl font-bold text-ink"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Stories from the Great War
          </h2>
          <p className="text-ink/50 mt-3 max-w-xl mx-auto text-sm">
            The Bhagavad Gita arose from this epic moment — a battlefield, a dilemma, and a divine
            conversation that changed the course of history.
          </p>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-saffron/15 rounded-2xl p-6 space-y-4">
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
              className="border border-saffron/20 rounded-2xl p-6 hover:border-saffron/50
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
                className="text-ink text-xl font-semibold mb-3 leading-snug"
                style={{ fontFamily: 'Crimson Text, serif' }}
              >
                {story.title}
              </h3>

              {/* Description */}
              <p className="text-ink/60 text-sm leading-relaxed mb-4">{story.description}</p>

              {/* Lesson */}
              <div className="border-t border-ink/10 pt-4">
                <p className="text-saffron/60 text-xs uppercase tracking-wider mb-1">Lesson</p>
                <p className="text-ink/80 text-sm leading-relaxed">{story.moral}</p>
              </div>

              {/* Characters */}
              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
                {story.characters.map((c) => (
                  <span key={c} className="text-ink/25 text-xs">
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
