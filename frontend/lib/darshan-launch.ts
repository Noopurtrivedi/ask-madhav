'use client'

/**
 * Darshan — shared contract between the launch sequence and the page it
 * unveils. Kept deliberately tiny and event-based (mirroring the existing
 * `madhav:prefill` / `madhav:voice` idiom) so no state is threaded through the
 * React tree and every consumer can fail open.
 */

/** Fired on `window` the moment the Sudarshan Chakra has landed in the logo. */
export const DARSHAN_READY_EVENT = 'madhav:darshan-ready'

/**
 * Attribute marking the element the chakra flies into at the end of the launch
 * sequence (the navbar logo). `ChakraLaunch` measures it at flight time, so the
 * logo can move or resize freely without the animation being re-tuned.
 */
export const CHAKRA_LOGO_ATTR = 'data-chakra-logo'

/** Session key — the launch ritual plays once per browsing session, not per navigation. */
const SESSION_KEY = 'askmadhav_darshan_launched'

/**
 * Module-level mirror of the event, so a component that mounts *after* the
 * chakra has landed can read the state synchronously instead of waiting for an
 * event that already fired.
 */
let ready = false

export function isDarshanReady(): boolean {
  return ready
}

/** Server snapshot for `useSyncExternalStore` — nothing is revealed yet. */
export function darshanNotReady(): boolean {
  return false
}

/**
 * Subscribe to the landing. Pairs with `isDarshanReady` in
 * `useSyncExternalStore`, which re-reads the snapshot immediately after
 * subscribing — so a consumer whose effect runs *after* the ritual already
 * finished (React runs child effects before the parent's) still sees it.
 */
export function subscribeDarshanReady(onChange: () => void): () => void {
  window.addEventListener(DARSHAN_READY_EVENT, onChange)
  return () => window.removeEventListener(DARSHAN_READY_EVENT, onChange)
}

export function announceDarshanReady(): void {
  if (ready) return
  ready = true
  try {
    window.dispatchEvent(new CustomEvent(DARSHAN_READY_EVENT))
  } catch {
    /* never let a decorative event break the page */
  }
}

/**
 * Fired when the seeker *releases* the chakra themselves — by clicking the logo.
 * The arrival ritual plays once per session; this is the deliberate replay, and
 * it is thrown harder and faster than the welcome.
 */
export const DARSHAN_REPLAY_EVENT = 'madhav:darshan-replay'

export function replayDarshanLaunch(): void {
  try {
    window.dispatchEvent(new CustomEvent(DARSHAN_REPLAY_EVENT))
  } catch {
    /* a decorative flourish must never break the page */
  }
}

export function subscribeDarshanReplay(onReplay: () => void): () => void {
  window.addEventListener(DARSHAN_REPLAY_EVENT, onReplay)
  return () => window.removeEventListener(DARSHAN_REPLAY_EVENT, onReplay)
}

/** Has the launch ritual already played this session? Storage errors → play it. */
export function hasLaunchedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function markLaunched(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode — the ritual simply plays again next navigation */
  }
}
