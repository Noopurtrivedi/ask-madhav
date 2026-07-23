/**
 * Darshan Experience Engine — the state machine.
 *
 * One source of truth for "what is the experience doing right now". Visual
 * subsystems never hold their own timers-of-record; they read `state` and the
 * `DarshanStateProfile` and render accordingly. That is what keeps the sacred
 * motion language coherent: when the engine is calm, *everything* is calm.
 *
 * Two rules make this safe:
 *   1. `reduced_motion` is terminal. Once entered, the only way out is a change
 *      in the seeker's own preference — no transition can override it.
 *   2. Every transition is explicit (`TRANSITIONS`). An illegal request is
 *      ignored rather than throwing, so a mis-wired component can never take
 *      the page down. This mirrors the app-wide fail-open discipline.
 */
import type { DarshanState, DarshanStateProfile } from './types'

export const DARSHAN_STATES: Record<DarshanState, DarshanStateProfile> = {
  loading: {
    id: 'loading',
    intensity: 0.35,
    tempo: 1,
    description: 'First paint. The chakra holds the centre; nothing else moves.',
  },
  entering: {
    id: 'entering',
    intensity: 0.85,
    tempo: 0.9,
    next: 'idle',
    holdMs: 2200,
    description: 'The chakra has flown to the logo and the scene blooms into being.',
  },
  idle: {
    id: 'idle',
    intensity: 0.3,
    tempo: 1,
    description: 'Rest. Breathing aura, slow drift, nothing demanding attention.',
  },
  quote_reveal: {
    id: 'quote_reveal',
    intensity: 0.5,
    tempo: 1.15,
    next: 'idle',
    holdMs: 2600,
    description: 'A shloka surfaces; the scene quietens so the words can be read.',
  },
  thinking: {
    id: 'thinking',
    intensity: 0.55,
    tempo: 1.2,
    description: 'A question has been asked. Inward, attentive, unhurried.',
  },
  answering: {
    id: 'answering',
    intensity: 0.7,
    tempo: 1,
    next: 'idle',
    holdMs: 2800,
    description: 'The answer arrives. The aura opens a little; the chakra settles.',
  },
  blessing: {
    id: 'blessing',
    intensity: 0.9,
    tempo: 1.3,
    next: 'idle',
    holdMs: 3200,
    description: 'A benedictory beat after a deep answer. The aura expands, then rests.',
  },
  chakra_processing: {
    id: 'chakra_processing',
    intensity: 0.5,
    tempo: 0.85,
    description: 'Generic async work. Only the chakra moves — the scene waits.',
  },
  vishwaroop_reveal: {
    id: 'vishwaroop_reveal',
    intensity: 1,
    tempo: 0.75,
    description: 'The cosmic form. Rare, consented, bounded in time.',
  },
  page_transition: {
    id: 'page_transition',
    intensity: 0.25,
    tempo: 1,
    next: 'idle',
    holdMs: 700,
    description: 'A route change. A soft cross-fade — never a feather storm.',
  },
  error: {
    id: 'error',
    intensity: 0.15,
    tempo: 1.8,
    next: 'idle',
    holdMs: 2600,
    description: 'Something failed. The engine slows and dims. It never flashes.',
  },
  reduced_motion: {
    id: 'reduced_motion',
    intensity: 0,
    tempo: 1,
    description: 'Motion is off by preference. Static, legible, complete.',
  },
}

/**
 * Legal transitions. Absent keys mean "reachable from anywhere" is NOT assumed
 * — every edge is written down so the experience cannot jump somewhere jarring
 * (e.g. idle → vishwaroop_reveal without passing through consent).
 */
const TRANSITIONS: Record<DarshanState, DarshanState[]> = {
  loading: ['entering', 'error', 'reduced_motion'],
  entering: ['idle', 'quote_reveal', 'error', 'reduced_motion', 'page_transition'],
  idle: [
    'quote_reveal',
    'thinking',
    'chakra_processing',
    'vishwaroop_reveal',
    'page_transition',
    'error',
    'reduced_motion',
  ],
  quote_reveal: ['idle', 'thinking', 'chakra_processing', 'page_transition', 'error', 'reduced_motion'],
  thinking: ['answering', 'idle', 'error', 'reduced_motion'],
  answering: ['blessing', 'idle', 'quote_reveal', 'thinking', 'error', 'reduced_motion'],
  blessing: ['idle', 'thinking', 'quote_reveal', 'error', 'reduced_motion'],
  chakra_processing: ['idle', 'answering', 'quote_reveal', 'error', 'reduced_motion'],
  vishwaroop_reveal: ['idle', 'error', 'reduced_motion'],
  page_transition: ['idle', 'entering', 'error', 'reduced_motion'],
  error: ['idle', 'entering', 'reduced_motion'],
  // Terminal by design — see the file header.
  reduced_motion: [],
}

export function canTransition(from: DarshanState, to: DarshanState): boolean {
  if (from === to) return true
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function profileOf(state: DarshanState): DarshanStateProfile {
  return DARSHAN_STATES[state] ?? DARSHAN_STATES.idle
}

/** States during which the Sudarshan Chakra should be actively turning. */
export function isChakraSpinning(state: DarshanState): boolean {
  return state === 'loading' || state === 'thinking' || state === 'chakra_processing'
}

/**
 * Bridge to `SudarshanChakra`'s own four-value vocabulary.
 *
 * The chakra component predates the engine and owns its easing (it interpolates
 * *toward* the speed/glow of its state rather than snapping). Rather than
 * rewrite it, the engine speaks its language: twelve engine states collapse to
 * the four behaviours the discus can actually express.
 *
 * Note `error` maps to `settling`, never to a faster or flashing state — the
 * brief is explicit that the chakra calms down on failure.
 */
export function chakraStateFor(state: DarshanState): 'idle' | 'processing' | 'settling' | 'still' {
  switch (state) {
    case 'loading':
    case 'thinking':
    case 'chakra_processing':
      return 'processing'
    case 'answering':
    case 'page_transition':
    case 'error':
      return 'settling'
    case 'blessing':
    case 'vishwaroop_reveal':
      return 'idle'
    case 'reduced_motion':
      return 'still'
    default:
      return 'idle'
  }
}

/** States that mean "an answer flow is in progress" — used by the chat bridge. */
export function isBusy(state: DarshanState): boolean {
  return state === 'thinking' || state === 'chakra_processing' || state === 'loading'
}

/**
 * The scene's overall energy for a state at a tier, 0..1. Every animated
 * subsystem multiplies its amplitude by this, so lowering a tier calms the
 * *whole* experience at once instead of each component guessing.
 */
export function energyFor(state: DarshanState, tierScale: number): number {
  return Math.max(0, Math.min(1, profileOf(state).intensity * tierScale))
}
