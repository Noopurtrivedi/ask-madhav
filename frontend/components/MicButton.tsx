'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnswerLanguage } from '@/types'

/**
 * MicButton — hands-free voice input via the browser's free Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition). Speaks the seeker's question
 * into the chat. Recognition language follows the chosen answer language
 * (Hindi → hi-IN, else en-IN). Renders nothing where the API is unavailable
 * (e.g. Firefox), so the typed input remains the reliable path.
 */

// Minimal typings — the Web Speech API isn't in the standard DOM lib.
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

interface Props {
  language?: AnswerLanguage
  disabled?: boolean
  /** Live (interim) transcript — updates the input as the seeker speaks. */
  onInterim?: (text: string) => void
  /** Final transcript — fired once when speech settles. */
  onResult: (text: string) => void
}

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export default function MicButton({ language = 'english', disabled, onInterim, onResult }: Props) {
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    setSupported(getCtor() !== null)
    return () => recRef.current?.stop()
  }, [])

  const start = () => {
    const Ctor = getCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = language === 'hindi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      if (interim) onInterim?.(finalText + interim)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      if (finalText.trim()) onResult(finalText.trim())
    }
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  const toggle = () => {
    if (disabled) return
    if (listening) recRef.current?.stop()
    else start()
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? 'Stop listening' : 'Ask by voice'}
      aria-pressed={listening}
      className={`flex-shrink-0 w-12 rounded-xl border transition-all flex items-center justify-center
        disabled:opacity-40 disabled:cursor-not-allowed ${
          listening
            ? 'bg-saffron/20 border-saffron/60 text-saffron animate-pulse'
            : 'bg-saffron/5 border-saffron/20 text-ink/50 hover:border-saffron/50 hover:text-saffron'
        }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    </button>
  )
}
