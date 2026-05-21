'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  /** The transliteration text to recite and highlight word-by-word. */
  text: string
  /** Show a meditation loop toggle (used on the daily verse). */
  meditation?: boolean
}

/**
 * Sacred Audio — recites the verse transliteration aloud using the browser's
 * built-in SpeechSynthesis (free, no API). Highlights each word as it is spoken
 * via `onboundary` events. An optional meditation mode loops the recitation for
 * quiet contemplation.
 */
export default function VerseAudio({ text, meditation = false }: Props) {
  const [supported, setSupported] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [wordIndex, setWordIndex] = useState(-1)
  const [loop, setLoop] = useState(false)
  const loopRef = useRef(false)

  const words = text.split(/\s+/).filter(Boolean)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stop = () => {
    loopRef.current = false
    setLoop(false)
    window.speechSynthesis.cancel()
    setPlaying(false)
    setWordIndex(-1)
  }

  const speak = () => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.78 // slow, reverent pace
    u.pitch = 1

    u.onboundary = (e) => {
      // Map character offset → word index for live highlighting.
      const upto = text.slice(0, e.charIndex)
      const idx = upto.split(/\s+/).filter(Boolean).length
      setWordIndex(Math.min(idx, words.length - 1))
    }
    u.onend = () => {
      setWordIndex(-1)
      if (loopRef.current) {
        // brief pause between repetitions for breathing room
        setTimeout(() => loopRef.current && speak(), 1400)
      } else {
        setPlaying(false)
      }
    }
    window.speechSynthesis.speak(u)
    setPlaying(true)
  }

  const togglePlay = () => {
    if (!supported) return
    if (playing) {
      stop()
    } else {
      speak()
    }
  }

  const toggleMeditation = () => {
    if (!supported) return
    const next = !loop
    setLoop(next)
    loopRef.current = next
    if (next && !playing) speak()
    if (!next && playing) stop()
  }

  if (!supported) {
    // Graceful: just show the transliteration with no controls.
    return <p className="text-ink/40 text-sm italic">{text}</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Stop recitation' : 'Play recitation'}
          className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-saffron/15 border border-saffron/30
                     flex items-center justify-center text-saffron hover:bg-saffron/30 transition-colors"
        >
          {playing ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <path d="M3 2l7 4-7 4z" />
            </svg>
          )}
        </button>

        <p className="text-sm italic leading-relaxed">
          {words.map((w, i) => (
            <span
              key={i}
              className={
                i === wordIndex
                  ? 'text-saffron font-medium transition-colors'
                  : 'text-ink/40 transition-colors'
              }
            >
              {w}{' '}
            </span>
          ))}
        </p>
      </div>

      {meditation && (
        <button
          onClick={toggleMeditation}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            loop
              ? 'border-saffron/60 text-saffron bg-saffron/10'
              : 'border-saffron/20 text-ink/50 hover:border-saffron/40'
          }`}
        >
          🧘 {loop ? 'Meditation on · tap to stop' : 'Meditation mode'}
        </button>
      )}
    </div>
  )
}
