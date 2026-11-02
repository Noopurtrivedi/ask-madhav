'use client'

/** The Mahabharata stories, filtered by the people in them. */

import Link from 'next/link'
import { useMemo, useState } from 'react'

export interface StorySummary {
  slug: string
  title: string
  description: string
  characters: string[]
}

export default function StoryLibrary({ stories }: { stories: StorySummary[] }) {
  const [person, setPerson] = useState<string | null>(null)

  // The lead of each story, so Karna appears even though few stories feature him.
  const people = useMemo(() => [...new Set(stories.map((s) => s.characters[0]))], [stories])

  const shown = person ? stories.filter((s) => s.characters.includes(person)) : stories

  return (
    <>
      <div role="group" aria-label="Filter stories by character" className="mb-8 flex flex-wrap justify-center gap-2">
        <button type="button" aria-pressed={person === null} onClick={() => setPerson(null)} className="story-chip">
          All stories
        </button>
        {people.map((p) => (
          <button key={p} type="button" aria-pressed={person === p} onClick={() => setPerson(p)} className="story-chip">
            {p}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((s) => (
          <Link key={s.slug} href={`/stories/${s.slug}`} className="library-card">
            <span className="block font-display text-xl font-semibold leading-snug text-moonlight">{s.title}</span>
            <span className="mt-3 block text-sm leading-relaxed text-moonlight/65">{s.description}</span>
            <span className="mt-4 block text-xs uppercase tracking-[0.18em] text-gold-soft/80">Read the story</span>
          </Link>
        ))}
      </div>
    </>
  )
}
