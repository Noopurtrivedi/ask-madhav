'use client'

/**
 * FluteToggle — a short bansuri theme with tabla, santoor, tanpura and strings, only when the seeker asks for it.
 *
 * The app never autoplays sound. The phrase is original: synthesised from code,
 * with no samples (public/audio, recipe in docs/AVATAR.md). The file is fetched
 * on the first tap, so it costs nothing until then.
 */

import { useRef, useState } from 'react'

export default function FluteToggle() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    if (!audio.current) {
      const a = new Audio()
      a.src = a.canPlayType('audio/webm; codecs=opus') ? '/audio/krishna-rhythm.webm' : '/audio/krishna-rhythm.m4a'
      a.volume = 0.7
      a.onended = () => setPlaying(false)
      audio.current = a
    }
    const a = audio.current
    if (playing) {
      a.pause()
      a.currentTime = 0
      setPlaying(false)
    } else {
      setPlaying(true)
      a.play().catch(() => setPlaying(false))
    }
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={playing} className="caps-link mt-4 inline-flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {playing ? (
          <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M6 12V3.5l7-1.5v8.5M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7-1.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        )}
      </svg>
      {playing ? 'Stop the flute' : 'Hear the flute'}
    </button>
  )
}
