'use client'

import { useSyncExternalStore } from 'react'

/**
 * Motion preferences — the single place the Darshan layer asks "am I allowed
 * to animate?". Every sacred motion (chakra spin, mor pankh drift, launch
 * sequence, star twinkle) must degrade to a calm static state when this is
 * true. Fail-open: if `matchMedia` is unavailable we assume motion is fine.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

function subscribe(onChange: () => void): () => void {
  let mq: MediaQueryList | undefined
  try {
    mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  } catch {
    return () => {}
  }
  if (!mq) return () => {}
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/**
 * React hook form. `useSyncExternalStore` keeps the server snapshot (`false`)
 * and the hydrated client render consistent, and re-renders if the seeker
 * flips the preference mid-session.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
