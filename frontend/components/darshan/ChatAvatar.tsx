'use client'

/**
 * ChatAvatar — Madhav's presence beside each reply, as the Sudarshan Chakra.
 *
 * Replaces the plain luminous dot. The brand mark *is* the avatar: it rests as a
 * slow idle turn, and spins up — the same "processing" motion the navbar logo
 * uses — whenever Madhav is thinking or speaking this reply. So the moment
 * Madhav is composing or reading aloud, his little chakra turns, exactly like
 * the logo does.
 *
 * Speech is detected off the existing `madhav:voice` bus (the same one
 * `SpeakButton` drives and `MadhavLight` listened to), matched by message id, so
 * only the reply being read reacts. `thinking` covers the loading indicator.
 */

import { useEffect, useRef, useState } from 'react'
import SudarshanChakra, { type ChakraState } from './SudarshanChakra'

type VoiceDetail = { id?: string; level?: number; active?: boolean }

interface Props {
  /** The message id this avatar belongs to — matched against voice events. */
  id?: string
  size?: number
  /** Force the spinning "processing" state — used by the loading indicator. */
  thinking?: boolean
}

export default function ChatAvatar({ id, size = 34, thinking = false }: Props) {
  const [speaking, setSpeaking] = useState(false)
  // Brief tail so the chakra eases down through `settling` rather than snapping
  // back to idle the instant the voice stops.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    if (!id) return
    const onVoice = (e: Event) => {
      const d = (e as CustomEvent<VoiceDetail>).detail
      if (!d || d.id !== id) return
      if (d.active === false) {
        setSpeaking(false)
        setSettling(true)
        if (settleTimer.current) clearTimeout(settleTimer.current)
        settleTimer.current = setTimeout(() => setSettling(false), 1400)
      } else if (d.active === true || typeof d.level === 'number') {
        setSpeaking(true)
        setSettling(false)
      }
    }
    window.addEventListener('madhav:voice', onVoice)
    return () => {
      window.removeEventListener('madhav:voice', onVoice)
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
  }, [id])

  const state: ChakraState = thinking || speaking ? 'processing' : settling ? 'settling' : 'idle'

  return <SudarshanChakra size={size} state={state} />
}
