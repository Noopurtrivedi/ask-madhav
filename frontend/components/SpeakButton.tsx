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
    u.rate = 0.92
    u.pitch = 1
    const match =
      voicesRef.current.find((v) => v.lang === lang) ||
      voicesRef.current.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 2)))
    if (match) u.voice = match
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
    setPlaying(true)
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
