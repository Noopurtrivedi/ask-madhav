'use client'

/**
 * EngineChakra — the Sudarshan Chakra, wired to the Darshan engine.
 *
 * `SudarshanChakra` is the *drawing* and its easing; this is the *conducting*.
 * It reads the engine's current `DarshanState`, maps it to the chakra's own
 * four-value vocabulary (`chakraStateFor`) and hands it over. That is why the
 * navbar logo starts turning the instant a question is asked and settles when
 * the answer begins — with no chat code reaching into the navbar.
 *
 * Used with no provider above it (e.g. on `/journal`), it degrades to a plain
 * idle chakra rather than throwing. The engine is always optional.
 */

import SudarshanChakra from './SudarshanChakra'
import { useDarshanOptional } from './DarshanProvider'
import { chakraStateFor } from '@/lib/darshan/states'

interface Props {
  size?: number
  className?: string
  title?: string
  /** Pin to one behaviour, ignoring the engine (used by the launch ritual). */
  override?: 'idle' | 'processing' | 'settling' | 'still'
}

export default function EngineChakra({ size = 30, className = '', title, override }: Props) {
  const darshan = useDarshanOptional()
  const state = override ?? (darshan ? chakraStateFor(darshan.state) : 'idle')
  return <SudarshanChakra size={size} state={state} className={className} title={title} />
}

/**
 * ChakraLoader — the processing indicator for AI work.
 *
 * The brief's `chakra_processing` state made visible: the discus turns while
 * Madhav considers, with a quiet line of text beside it. No spinner, no dots,
 * no bouncing — the loading moment is part of the sacred experience, not a gap
 * in it.
 *
 * `aria-live="polite"` announces the wait once to a screen reader; the chakra
 * itself stays `aria-hidden` because it carries no information a reader needs.
 */
export function ChakraLoader({
  label = 'Madhav is reflecting…',
  size = 34,
}: {
  label?: string
  size?: number
}) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <EngineChakra size={size} override="processing" />
      <span className="text-ink/50 text-sm">{label}</span>
    </div>
  )
}
