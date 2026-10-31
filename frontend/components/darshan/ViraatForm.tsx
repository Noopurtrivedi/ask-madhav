'use client'

/**
 * ViraatForm — the Vishwaroop as "everything and everyone" (Gita 11.7, 11.15).
 *
 * Krishna at the centre; behind him, one head at a time, the ten avatars and the
 * gods the chapter names or popular tradition places within him. An image model
 * cannot reliably paint twenty distinct heads at once, so each is its own
 * generated, reviewed cut-out and the form is assembled here. That also lets
 * every head emerge in turn, nearest first.
 *
 * Inclusions, by source:
 *  - Gita 11.15: Brahma, and all the gods. 11.39: Agni, Varuna, the Moon.
 *  - Narasimha and Varaha are the classic side heads of Vishvarupa images.
 *  - Shiva, Ganesha, Hanuman, Garuda and Surya follow popular modern depiction.
 *  - The Mahabharata's devouring imagery (11.25–30) is left out on purpose: the
 *    app must never create fear.
 *
 * `ending` swells the form past the edges of the frame into light. It is pure
 * transform and opacity. Under reduced motion it never plays.
 */

import Image from 'next/image'

interface Head {
  id: string
  /** Degrees from straight up; negative is the viewer's left. */
  deg: number
}

// The near arc overlaps the far one, so its order is what the seeker sees first.
const NEAR: Head[] = [
  { id: 'rama', deg: -24 },
  { id: 'brahma', deg: 24 },
  { id: 'shiva', deg: -48 },
  { id: 'varaha', deg: 48 },
  { id: 'narasimha', deg: -72 },
  { id: 'ganesha', deg: 72 },
  { id: 'hanuman', deg: -94 },
  { id: 'garuda', deg: 94 },
]
const FAR: Head[] = [
  { id: 'buddha', deg: -10 },
  { id: 'surya', deg: 10 },
  { id: 'parashurama', deg: -30 },
  { id: 'indra', deg: 30 },
  { id: 'vamana', deg: -50 },
  { id: 'agni', deg: 50 },
  { id: 'kurma', deg: -70 },
  { id: 'varuna', deg: 70 },
  { id: 'matsya', deg: -90 },
  { id: 'chandra', deg: 90 },
  { id: 'kalki', deg: -110 },
]

function Heads({ heads, far, start }: { heads: Head[]; far: boolean; start: number }) {
  return heads.map((h, i) => (
    <span
      key={h.id}
      className={`viraat-head ${far ? 'viraat-far' : ''}`}
      style={{ ['--deg' as string]: `${h.deg}deg`, ['--flip' as string]: h.deg > 0 ? -1 : 1, animationDelay: `${start + i * 420}ms` }}
    >
      <Image src={`/art/viraat/${h.id}.webp`} alt="" fill sizes="220px" className="object-contain" />
    </span>
  ))
}

export default function ViraatForm({ ending }: { ending: boolean }) {
  return (
    <div className={`viraat ${ending ? 'viraat-ending' : ''}`} aria-hidden="true">
      <div className="viraat-grow">
        <span className="viraat-aura" />
        <Heads heads={FAR} far start={NEAR.length * 420} />
        <Heads heads={NEAR} far={false} start={0} />
        <div className="viraat-body">
          <Image src="/art/viraat/krishna-form.webp" alt="" fill sizes="(min-width: 768px) 70vh, 90vw" className="object-contain" priority />
        </div>
      </div>
    </div>
  )
}
