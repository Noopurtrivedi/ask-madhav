/**
 * Darshan Experience Engine — the event bus.
 *
 * Any component can drive the engine without being wrapped in (or importing)
 * the provider: `darshan.thinking()` dispatches a window event and the provider
 * reduces it. This mirrors the idiom the app already uses for `madhav:prefill`
 * and `madhav:voice`, and it keeps existing components — `ChatInterface` is 687
 * lines — free of prop-drilling for a purely visual concern.
 *
 * Every helper is a no-op on the server, so these are safe to call from any
 * lifecycle without a `typeof window` guard at the call site.
 */
import type { DarshanState } from './types'

export const DARSHAN_EVENT = 'madhav:darshan'

export interface DarshanEventDetail {
  /** Requested state. Ignored by the provider if the transition is illegal. */
  state: DarshanState
  /** Optional quote reference ("2.47") to reveal alongside the state. */
  quoteRef?: string
  /** Free-form origin, for the debug panel. */
  source?: string
}

export function requestDarshanState(detail: DarshanEventDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<DarshanEventDetail>(DARSHAN_EVENT, { detail }))
}

export function onDarshanEvent(handler: (detail: DarshanEventDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<DarshanEventDetail>).detail
    if (detail?.state) handler(detail)
  }
  window.addEventListener(DARSHAN_EVENT, listener)
  return () => window.removeEventListener(DARSHAN_EVENT, listener)
}

/**
 * Ergonomic facade. Import this anywhere:
 *
 *   import { darshan } from '@/lib/darshan/events'
 *   darshan.thinking('chat')          // question sent
 *   darshan.answering('chat')         // answer arriving
 *   darshan.idle('chat')              // back to rest
 */
export const darshan = {
  loading: (source?: string) => requestDarshanState({ state: 'loading', source }),
  entering: (source?: string) => requestDarshanState({ state: 'entering', source }),
  idle: (source?: string) => requestDarshanState({ state: 'idle', source }),
  thinking: (source?: string) => requestDarshanState({ state: 'thinking', source }),
  answering: (source?: string) => requestDarshanState({ state: 'answering', source }),
  blessing: (source?: string) => requestDarshanState({ state: 'blessing', source }),
  processing: (source?: string) => requestDarshanState({ state: 'chakra_processing', source }),
  vishwaroop: (source?: string) => requestDarshanState({ state: 'vishwaroop_reveal', source }),
  pageTransition: (source?: string) => requestDarshanState({ state: 'page_transition', source }),
  error: (source?: string) => requestDarshanState({ state: 'error', source }),
  quote: (quoteRef?: string, source?: string) =>
    requestDarshanState({ state: 'quote_reveal', quoteRef, source }),
}
