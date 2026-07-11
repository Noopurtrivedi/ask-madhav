'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnswerLanguage } from '@/types'

/**
 * SpeakButton — reads an answer aloud so every reply has a spoken "voice
 * transcript" for blind / low-vision seekers and anyone who prefers to listen.
 *
 * Primary path: server TTS (/api/tts → Gemini) which gives a guaranteed calm
 * MALE voice in both Hindi and English on every device. If that's unavailable
 * (no key, offline, error), it falls back to the browser's free SpeechSynthesis
 * — there we still prefer a same-language male voice and lower the pitch.
 *
 * `autoPlay` lets the chat speak each new answer automatically (hands-free).
 */
interface Props {
  text: string
  language?: AnswerLanguage
  autoPlay?: boolean
  /** Message id — lets the matching MadhavLight avatar pulse with this voice. */
  speechId?: string
}

function bcp47(language: AnswerLanguage = 'english'): string {
  return language === 'hindi' ? 'hi-IN' : 'en-IN'
}

// Tell the matching MadhavLight avatar how brightly to glow. `active` wakes the
// light; `level` (0..1) is the live voice amplitude. See components/MadhavLight.
function emitVoice(detail: { id?: string; level?: number; active?: boolean }) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('madhav:voice', { detail }))
}

const MALE_HINTS = [
  'hemant', 'madhur', 'prabhat', 'ravi', 'rishi', 'kabir', 'arjun',
  'daniel', 'alex', 'fred', 'thomas', 'oliver', 'gordon', 'rishi',
  'google uk english male', 'male',
]
const FEMALE_HINTS = [
  'female', 'google हिन्दी', 'heera', 'kalpana', 'swara', 'veena', 'lekha',
  'samantha', 'aditi', 'raveena', 'neerja', 'priya', 'kishori', 'zira', 'susan',
]

// Pick a male voice ONLY within the target language (an English voice cannot
// pronounce Devanagari). Returns null → engine uses its own default for lang.
function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const two = lang.slice(0, 2)
  const sameLang = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(two))
  if (!sameLang.length) return null
  const scored = sameLang.map((v) => {
    const name = v.name.toLowerCase()
    const vlang = (v.lang || '').toLowerCase()
    let score = 0
    if (vlang === lang.toLowerCase()) score += 3
    if (vlang.endsWith('-in') || vlang.includes('_in')) score += 2
    if (MALE_HINTS.some((h) => name.includes(h))) score += 4
    if (FEMALE_HINTS.some((h) => name.includes(h))) score -= 4
    return { v, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].v
}

export default function SpeakButton({ text, language = 'english', autoPlay = false, speechId }: Props) {
  const [playing, setPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const didAutoPlay = useRef(false)
  // Tears down the Web Audio analyser + tells the avatar to rest. Set while the
  // server voice is playing; called on end / error / stop.
  const voiceCleanupRef = useRef<(() => void) | null>(null)
  const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Drive the MadhavLight avatar from the playing <audio> via a Web Audio
  // analyser: each frame we read the RMS amplitude and emit it as the glow
  // level. Fail-open — if Web Audio is unavailable/blocked, the light still
  // wakes (active:true was emitted separately) and simply self-shimmers.
  const startVoiceAnalysis = async (audio: HTMLAudioElement) => {
    voiceCleanupRef.current?.()
    let raf = 0
    let ctx: AudioContext | null = null
    const rest = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      emitVoice({ id: speechId, level: 0, active: false })
      ctx?.close().catch(() => {})
      ctx = null
    }
    voiceCleanupRef.current = rest
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      ctx = new AC()
      await ctx.resume().catch(() => {})
      // A suspended context would route (and silence) the audio through Web
      // Audio — so only tap it once we know it's running; else leave the
      // element to play normally and let the light self-shimmer.
      if (ctx.state !== 'running') {
        ctx.close().catch(() => {})
        ctx = null
        return
      }
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(ctx.destination)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        emitVoice({ id: speechId, level: Math.min(1, rms * 2.6), active: true })
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    } catch {
      /* analysis unavailable — the light stays awake and self-shimmers */
    }
  }

  useEffect(() => {
    if (!hasSynthesis) return
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [hasSynthesis])

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (hasSynthesis) window.speechSynthesis.cancel()
    voiceCleanupRef.current?.() // tear down analyser
    voiceCleanupRef.current = null
    emitVoice({ id: speechId, level: 0, active: false }) // rest the avatar
    setPreparing(false)
    setPlaying(false)
  }

  // Fallback: the browser's built-in voice (used only if server TTS fails).
  const speakLocal = () => {
    if (!hasSynthesis) {
      setPlaying(false)
      return
    }
    window.speechSynthesis.cancel()
    const lang = bcp47(language)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 0.8
    u.pitch = 0.8 // lower → warmer/deeper when only a female voice exists
    const match = pickVoice(voicesRef.current, lang)
    if (match) {
      u.voice = match
      u.lang = match.lang
    }
    // No amplitude available from SpeechSynthesis — just wake the avatar so it
    // shimmers while speaking, and rest it when done.
    const restLight = () => emitVoice({ id: speechId, level: 0, active: false })
    u.onstart = () => emitVoice({ id: speechId, active: true })
    u.onend = () => {
      restLight()
      setPlaying(false)
    }
    u.onerror = () => {
      restLight()
      setPlaying(false)
    }
    emitVoice({ id: speechId, active: true })
    window.speechSynthesis.speak(u)
    setPlaying(true)
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume()
      else clearInterval(keepAlive)
    }, 12000)
  }

  // Primary: Gemini male voice via the server.
  const speak = async () => {
    setPreparing(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('tts unavailable')
      const blob = await res.blob()
      if (controller.signal.aborted) return
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        voiceCleanupRef.current?.()
        voiceCleanupRef.current = null
        setPlaying(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        voiceCleanupRef.current?.()
        voiceCleanupRef.current = null
        URL.revokeObjectURL(url)
        speakLocal()
      }
      setPreparing(false)
      setPlaying(true)
      emitVoice({ id: speechId, active: true }) // wake the avatar immediately
      await audio.play()
      // Tap the amplitude only after playback starts (needs a live element).
      startVoiceAnalysis(audio)
    } catch {
      if (controller.signal.aborted) return
      setPreparing(false)
      speakLocal() // graceful fallback to the browser voice
    } finally {
      abortRef.current = null
    }
  }

  const toggle = () => {
    if (playing || preparing) stop()
    else speak()
  }

  // Auto-read the answer once when requested; stop if auto-read is switched off.
  useEffect(() => {
    if (autoPlay && !didAutoPlay.current) {
      didAutoPlay.current = true
      speak()
    } else if (!autoPlay && didAutoPlay.current) {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  return (
    <button
      onClick={toggle}
      aria-label={playing || preparing ? 'Stop reading the answer aloud' : 'Listen to this answer'}
      className="inline-flex items-center gap-1 text-saffron/70 hover:text-saffron text-[11px]
                 tracking-wider uppercase transition-colors"
    >
      {preparing ? (
        <svg width="12" height="12" viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : playing ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <rect x="2" y="2" width="8" height="8" rx="1" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5zM10.5 5a3.5 3.5 0 0 1 0 6M12.5 3a6 6 0 0 1 0 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      )}
      {preparing ? 'Preparing…' : playing ? 'Stop' : 'Listen'}
    </button>
  )
}
