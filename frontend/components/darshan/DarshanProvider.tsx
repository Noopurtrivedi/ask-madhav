'use client'

/**
 * DarshanProvider — the engine's runtime.
 *
 * Owns exactly three things:
 *   1. the current `DarshanState` (guarded by the transition table),
 *   2. the device/preference-derived `MotionTier`,
 *   3. the resolved `DarshanConfig` + the quote currently being reflected.
 *
 * Everything visual subscribes to this and nothing else. That is what makes the
 * motion language coherent — there is one clock, one energy level, one palette.
 *
 * Design notes worth keeping:
 *  · Capability is measured in an effect, never during render, so the server
 *    and the first client paint agree (`SERVER_CAPABILITY` = `lite`, no WebGL).
 *    The 3D layer therefore *always* mounts after hydration — by design.
 *  · `reduced_motion` is terminal in the machine, so it is stored as a separate
 *    latch here and re-applied if the media query flips mid-session.
 *  · The engine does NOT own the launch ritual. `ChakraLaunch` +
 *    `lib/darshan-launch.ts` already run the chakra's flight into the logo and
 *    the once-per-session bookkeeping; the provider merely *listens* for
 *    `madhav:darshan-ready` and moves loading → entering when the chakra lands.
 *    One owner per behaviour — the engine conducts, it does not duplicate.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { resolveDarshanConfig, heroForm, type DeepPartial } from '@/lib/darshan/config'
import { canTransition, energyFor, profileOf } from '@/lib/darshan/states'
import {
  SERVER_CAPABILITY,
  detectCapability,
  readMotionPreference,
  tierScale,
  writeMotionPreference,
} from '@/lib/darshan/tier'
import { onDarshanEvent } from '@/lib/darshan/events'
import { isDarshanReady, subscribeDarshanReady } from '@/lib/darshan-launch'
import { dailyQuote, loadQuotes, moodForQuote, quoteByReference } from '@/lib/darshan/quotes'
import type {
  AvatarForm,
  DarshanConfig,
  DarshanState,
  DeviceCapability,
  GitaQuote,
  MotionPreference,
  MotionTier,
  VisualMood,
} from '@/lib/darshan/types'

interface DarshanContextValue {
  config: DarshanConfig
  state: DarshanState
  /** Description + intensity + tempo for the current state. */
  profile: ReturnType<typeof profileOf>
  capability: DeviceCapability
  tier: MotionTier
  /** 0..1 — the scene's permitted energy right now (state × tier). */
  energy: number
  /** True once the client capability probe has run. */
  ready: boolean
  /** The form the hero is rendering. */
  form: AvatarForm
  /** The quote currently reflected, and the mood it paints. */
  quote: GitaQuote | null
  mood: VisualMood
  /** Should the 3D layer be fetched and mounted at all? */
  use3D: boolean

  setState: (next: DarshanState, opts?: { force?: boolean }) => void
  setQuote: (quote: GitaQuote | null) => void
  revealQuote: (quote: GitaQuote) => void
  motionPreference: MotionPreference
  setMotionPreference: (pref: MotionPreference) => void
}

const DarshanContext = createContext<DarshanContextValue | null>(null)

/**
 * Reading the engine outside a provider is not an error — it means the engine
 * is switched off for this subtree. Components handle `null` by rendering their
 * static form. Nothing throws.
 */
export function useDarshanOptional(): DarshanContextValue | null {
  return useContext(DarshanContext)
}

export function useDarshan(): DarshanContextValue {
  const ctx = useContext(DarshanContext)
  if (!ctx) {
    throw new Error('useDarshan must be used inside <DarshanProvider>. Use useDarshanOptional() for optional access.')
  }
  return ctx
}

interface Props {
  children: React.ReactNode
  /** Partial overrides on top of DEFAULT_DARSHAN_CONFIG (CMS values go here). */
  config?: DeepPartial<DarshanConfig>
}

export default function DarshanProvider({ children, config: overrides }: Props) {
  const config = useMemo(() => resolveDarshanConfig(overrides), [overrides])

  const [capability, setCapability] = useState<DeviceCapability>(SERVER_CAPABILITY)
  const [ready, setReady] = useState(false)
  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>('auto')
  const [state, setStateRaw] = useState<DarshanState>('loading')
  const [quote, setQuote] = useState<GitaQuote | null>(null)

  const stateRef = useRef<DarshanState>('loading')
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── the guarded transition ────────────────────────────────────────────────
  const setState = useCallback(
    (next: DarshanState, opts?: { force?: boolean }) => {
      const from = stateRef.current
      // reduced_motion is terminal: only an explicit force (a preference change)
      // may leave it. This is what guarantees an accessibility choice sticks.
      if (from === 'reduced_motion' && !opts?.force) return
      if (!opts?.force && !canTransition(from, next)) return
      if (from === next) return

      stateRef.current = next
      setStateRaw(next)
    },
    []
  )

  // ── auto-advance (entering → idle, blessing → idle, …) ────────────────────
  useEffect(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    const p = profileOf(state)
    if (!p.next || !p.holdMs) return
    // Reduced motion collapses every hold to a single frame — the state still
    // advances (so logic depending on it is unaffected) but nothing lingers.
    const delay = capability.tier === 'still' ? 0 : p.holdMs
    holdTimer.current = setTimeout(() => setState(p.next as DarshanState), delay)
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }, [state, capability.tier, setState])

  // ── capability probe + live reduced-motion tracking ───────────────────────
  useEffect(() => {
    const pref = readMotionPreference()
    setMotionPreferenceState(pref)

    const apply = (p: MotionPreference) => {
      const cap = detectCapability(p)
      setCapability(cap)
      setReady(true)
      if (cap.tier === 'still') {
        setState('reduced_motion', { force: true })
      } else if (stateRef.current === 'reduced_motion') {
        setState('idle', { force: true })
      } else if (stateRef.current === 'loading') {
        setState('entering')
      }
    }

    apply(pref)

    // A seeker can toggle the OS setting mid-session; honour it immediately.
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const onChange = () => apply(readMotionPreference())
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [setState])

  // ── the window event bus ──────────────────────────────────────────────────
  useEffect(
    () =>
      onDarshanEvent((detail) => {
        if (detail.quoteRef) {
          const q = quoteByReference(detail.quoteRef)
          if (q) setQuote(q)
        }
        setState(detail.state)
      }),
    [setState]
  )

  // ── the opening quote ─────────────────────────────────────────────────────
  useEffect(() => {
    setQuote((current) => current ?? dailyQuote(loadQuotes(config.quotes.themes)))
  }, [config.quotes.themes])

  // ── the launch ritual reports in ──────────────────────────────────────────
  // `ChakraLaunch` owns the flight and the once-per-session flag; we only take
  // the cue. `isDarshanReady()` is read first because the ritual may have landed
  // before this provider's effects ran (React runs child effects first).
  useEffect(() => {
    const onLanded = () => {
      if (stateRef.current === 'loading') setState('entering')
    }
    if (isDarshanReady()) onLanded()
    return subscribeDarshanReady(onLanded)
  }, [setState])

  const setMotionPreference = useCallback(
    (pref: MotionPreference) => {
      writeMotionPreference(pref)
      setMotionPreferenceState(pref)
      const cap = detectCapability(pref)
      setCapability(cap)
      setState(cap.tier === 'still' ? 'reduced_motion' : 'idle', { force: true })
    },
    [setState]
  )

  const revealQuote = useCallback(
    (q: GitaQuote) => {
      setQuote(q)
      setState('quote_reveal')
    },
    [setState]
  )

  const tier = capability.tier
  const use3D =
    config.enabled &&
    ready &&
    tier === 'full' &&
    capability.webglAvailable &&
    (config.hero.mode === '3d' || config.hero.mode === 'auto')

  const value = useMemo<DarshanContextValue>(
    () => ({
      config,
      state,
      profile: profileOf(state),
      capability,
      tier,
      energy: energyFor(state, tierScale(tier)),
      ready,
      form: heroForm(config),
      quote,
      mood: moodForQuote(quote ?? undefined),
      use3D,
      setState,
      setQuote,
      revealQuote,
      motionPreference,
      setMotionPreference,
    }),
    [
      config,
      state,
      capability,
      tier,
      ready,
      quote,
      use3D,
      setState,
      revealQuote,
      motionPreference,
      setMotionPreference,
    ]
  )

  return <DarshanContext.Provider value={value}>{children}</DarshanContext.Provider>
}
