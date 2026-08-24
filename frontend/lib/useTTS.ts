'use client'

/**
 * useTTS — shared client hook for Madhav's spoken voice.
 *
 * One architecture for every narration surface (story cards today; anything
 * spoken tomorrow): primary path is the server voice (/api/tts → Gemini TTS,
 * the same calm male Indian-accented voice the chat uses), falling back to the
 * browser's SpeechSynthesis when the server voice is unavailable — so "Hear
 * the story" always works, key or no key. Mirrors SpeakButton.tsx's transport
 * (which additionally drives the avatar glow and so keeps its own copy).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnswerLanguage } from '@/types'

export type TTSState = 'idle' | 'preparing' | 'playing'

export function useTTS() {
  const [state, setState] = useState<TTSState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setState('idle')
  }, [])

  // Never leave audio playing after the component unmounts.
  useEffect(() => stop, [stop])

  const speakLocal = useCallback((text: string, language: AnswerLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('idle')
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = language === 'hindi' ? 'hi-IN' : 'en-IN'
    u.rate = 0.88
    u.pitch = 0.85 // lower → warmer storyteller register
    u.onend = () => setState('idle')
    u.onerror = () => setState('idle')
    window.speechSynthesis.speak(u)
    setState('playing')
    // Some engines auto-pause long utterances — nudge them along.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume()
      else clearInterval(keepAlive)
    }, 12000)
  }, [])

  const speak = useCallback(
    async (text: string, language: AnswerLanguage = 'english') => {
      stop()
      setState('preparing')
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
          URL.revokeObjectURL(url)
          setState('idle')
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          speakLocal(text, language)
        }
        setState('playing')
        await audio.play()
      } catch {
        if (controller.signal.aborted) return
        speakLocal(text, language) // graceful fallback to the browser voice
      } finally {
        abortRef.current = null
      }
    },
    [stop, speakLocal],
  )

  return { speak, stop, state }
}
