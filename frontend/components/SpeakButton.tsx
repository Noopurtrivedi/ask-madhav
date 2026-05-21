'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnswerLanguage } from '@/types'

/**
 * SpeakButton — reads an answer aloud using the browser's free SpeechSynthesis,
 * so every reply has a spoken "voice transcript" for blind / low-vision seekers
 * and anyone who prefers to listen. The voice language follows the seeker's
 * chosen answer language (Hindi → hi-IN; English/Hinglish → an Indian-English
 * voice, which reads Roman text more intelligibly than a Devanagari voice).
 *
 * `autoPlay` lets the chat speak each new answer automatically (hands-free).
 * Degrades silently to nothing if SpeechSynthesis is unavailable.
 */
interface Props {
  text: string
  language?: AnswerLanguage
  autoPlay?: boolean
}

function bcp47(language: AnswerLanguage = 'english'): string {
  return language === 'hindi' ? 'hi-IN' : 'en-IN'
}

// Known INDIAN male voice names across platforms — so Madhav sounds like a
// calm Indian man. Female voices ("Google हिन्दी", "Samantha", "Heera"…) are
// the common defaults, so we score them down.
const MALE_HINTS = [
  'hemant', 'madhur', 'prabhat', 'ravi', 'rishi', 'kabir', 'arjun', // Indian male
  'google uk english male', 'daniel', 'aaron', 'fred', 'male',
]
const FEMALE_HINTS = [
  'female', 'google हिन्दी', 'heera', 'kalpana', 'swara', 'veena', 'lekha',
  'samantha', 'aditi', 'raveena', 'neerja', 'priya', 'kishori', 'zira', 'susan',
]

// Score each voice for "calm Indian male". Highest score wins, so even when no
// named male voice exists we still land on the best Indian-locale option.
function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const two = lang.slice(0, 2) // 'hi' or 'en'
  const scored = voices.map((v) => {
    const name = v.name.toLowerCase()
    const vlang = (v.lang || '').toLowerCase()
    let score = 0
    if (vlang === lang.toLowerCase()) score += 5 // exact hi-IN / en-IN
    else if (vlang.startsWith(two)) score += 2
    if (vlang.endsWith('-in') || vlang.includes('_in')) score += 3 // any Indian locale
    if (MALE_HINTS.some((h) => name.includes(h))) score += 4
    if (FEMALE_HINTS.some((h) => name.includes(h))) score -= 5
    return { v, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].score > 0 ? scored[0].v : voices[0]
}

export default function SpeakButton({ text, language = 'english', autoPlay = false }: Props) {
  const [supported, setSupported] = useState(true)
  const [playing, setPlaying] = useState(false)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const didAutoPlay = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
      return
    }
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const lang = bcp47(language)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.8 // slow, calm, unhurried
    u.pitch = 0.9 // slightly lower → warmer, more male
    const match = pickVoice(voicesRef.current, lang)
    if (match) u.voice = match
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
    setPlaying(true)

    // Chrome silently pauses long utterances after ~15s — nudge it to continue.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume()
      else clearInterval(keepAlive)
    }, 12000)
  }

  const toggle = () => {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
    } else {
      speak()
    }
  }

  // Auto-read the answer once when requested (hands-free / accessibility).
  useEffect(() => {
    if (autoPlay && supported && !didAutoPlay.current) {
      didAutoPlay.current = true
      speak()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, supported])

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      aria-label={playing ? 'Stop reading the answer aloud' : 'Listen to this answer'}
      className="inline-flex items-center gap-1 text-saffron/70 hover:text-saffron text-[11px]
                 tracking-wider uppercase transition-colors"
    >
      {playing ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <rect x="2" y="2" width="8" height="8" rx="1" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5zM10.5 5a3.5 3.5 0 0 1 0 6M12.5 3a6 6 0 0 1 0 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      )}
      {playing ? 'Stop' : 'Listen'}
    </button>
  )
}
