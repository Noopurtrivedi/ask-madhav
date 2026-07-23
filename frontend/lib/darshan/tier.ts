/**
 * Darshan Experience Engine — device capability + motion tiering.
 *
 * Decides how much experience this visitor's device and preferences can carry,
 * *before* a single kilobyte of WebGL is fetched. The 3D bundle is dynamically
 * imported only when `tier === 'full'`, so a low-end phone never pays for code
 * it will not run.
 *
 * Precedence, highest first:
 *   1. the seeker's explicit choice (`user_motion_preferences`),
 *   2. `prefers-reduced-motion`,
 *   3. Data Saver / low memory / low core count / no WebGL,
 *   4. `full`.
 *
 * Everything is defensive: this runs on real browsers with real quirks, and a
 * capability probe must never be the thing that breaks the hero.
 */
import type { DeviceCapability, MotionPreference, MotionTier, UserMotionPreferences } from './types'

export const MOTION_PREF_KEY = 'askmadhav_motion_pref'

/** How much a tier scales every animation's amplitude. */
export const TIER_SCALE: Record<MotionTier, number> = {
  full: 1,
  lite: 0.55,
  still: 0,
}

/** SSR-safe default: assume `lite` so the first paint is never WebGL. */
export const SERVER_CAPABILITY: DeviceCapability = {
  tier: 'lite',
  prefersReducedMotion: false,
  webglAvailable: false,
  deviceMemoryGb: null,
  hardwareConcurrency: null,
  saveData: false,
  coarsePointer: false,
  reason: 'server render — 3D is client-only',
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

/**
 * Probe WebGL by actually creating a context — feature-detecting `WebGLRenderingContext`
 * on the window lies on devices where the context creation itself fails.
 * The probe canvas is discarded immediately.
 */
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    if (!gl) return false
    // Release the context eagerly; some mobile browsers cap live contexts at ~8.
    const lose = (gl as WebGLRenderingContext).getExtension?.('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

export function readMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'auto'
  try {
    const raw = window.localStorage.getItem(MOTION_PREF_KEY)
    if (!raw) return 'auto'
    const parsed = JSON.parse(raw) as Partial<UserMotionPreferences>
    const pref = parsed?.preference
    if (pref === 'full' || pref === 'reduced' || pref === 'text-only' || pref === 'auto') {
      return pref
    }
  } catch {
    // Corrupt or blocked storage — behave as if nothing was ever chosen.
  }
  return 'auto'
}

export function writeMotionPreference(preference: MotionPreference): void {
  if (typeof window === 'undefined') return
  try {
    const record: UserMotionPreferences = {
      preference,
      mute_ambient: false,
      updated_at: new Date().toISOString(),
    }
    window.localStorage.setItem(MOTION_PREF_KEY, JSON.stringify(record))
  } catch {
    // Private mode / storage disabled — the preference simply does not persist.
  }
}

/**
 * Measure the device once, on the client.
 * `preference` overrides everything except its own 'auto' value.
 */
export function detectCapability(preference: MotionPreference = 'auto'): DeviceCapability {
  if (typeof window === 'undefined') return SERVER_CAPABILITY

  const nav = navigator as NavigatorWithHints
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  const deviceMemoryGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
  const hardwareConcurrency =
    typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null
  const saveData = Boolean(nav.connection?.saveData)
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  const slowNetwork = /(^|-)2g$/.test(nav.connection?.effectiveType ?? '')

  const base = {
    prefersReducedMotion,
    deviceMemoryGb,
    hardwareConcurrency,
    saveData,
    coarsePointer,
  }

  // 1. Explicit choice wins.
  if (preference === 'text-only' || preference === 'reduced') {
    return {
      ...base,
      webglAvailable: false,
      tier: 'still',
      reason: `seeker preference: ${preference}`,
    }
  }
  if (preference === 'full') {
    const webglAvailable = detectWebGL()
    return {
      ...base,
      webglAvailable,
      tier: webglAvailable ? 'full' : 'lite',
      reason: webglAvailable ? 'seeker preference: full' : 'seeker chose full, but WebGL is unavailable',
    }
  }

  // 2. Accessibility preference.
  if (prefersReducedMotion) {
    return { ...base, webglAvailable: false, tier: 'still', reason: 'prefers-reduced-motion: reduce' }
  }

  // 3. Device / network budget. Cheap signals only — no benchmarking loops.
  if (saveData || slowNetwork) {
    return { ...base, webglAvailable: false, tier: 'lite', reason: 'data saver / slow network' }
  }
  if (deviceMemoryGb !== null && deviceMemoryGb <= 4) {
    return { ...base, webglAvailable: false, tier: 'lite', reason: `deviceMemory ${deviceMemoryGb}GB` }
  }
  if (hardwareConcurrency !== null && hardwareConcurrency <= 4) {
    return {
      ...base,
      webglAvailable: false,
      tier: 'lite',
      reason: `hardwareConcurrency ${hardwareConcurrency}`,
    }
  }

  const webglAvailable = detectWebGL()
  if (!webglAvailable) {
    return { ...base, webglAvailable, tier: 'lite', reason: 'WebGL unavailable' }
  }

  return { ...base, webglAvailable, tier: 'full', reason: 'device meets the full-experience budget' }
}

export function tierScale(tier: MotionTier): number {
  return TIER_SCALE[tier] ?? TIER_SCALE.lite
}
