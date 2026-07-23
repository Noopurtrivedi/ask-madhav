'use client'

/**
 * DarshanDebugPanel — the QA surface for the engine.
 *
 * Twelve states, three tiers and a transition table are not something you can
 * verify by clicking around the site: `blessing` and `error` have no ordinary
 * path to them. This panel drives every state directly and reports what the
 * engine currently believes about the device.
 *
 * Gated on `?darshan=debug` and stripped from production builds, so it costs a
 * production visitor nothing. It is also the fastest way to check the sacred
 * motion language holds — flip through the states and watch whether anything
 * ever becomes aggressive.
 */

import { useEffect, useState } from 'react'
import { useDarshanOptional } from './DarshanProvider'
import { DARSHAN_STATES } from '@/lib/darshan/states'
import type { DarshanState } from '@/lib/darshan/types'

const ALL_STATES = Object.keys(DARSHAN_STATES) as DarshanState[]

export default function DarshanDebugPanel() {
  const engine = useDarshanOptional()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    try {
      setShow(new URLSearchParams(window.location.search).get('darshan') === 'debug')
    } catch {
      /* malformed URL — stay hidden */
    }
  }, [])

  if (!show || !engine) return null

  return (
    <div className="fixed bottom-4 left-4 z-[90] w-72 rounded-xl border border-saffron/30 bg-white/95 p-3 text-xs shadow-2xl backdrop-blur">
      <p className="mb-2 font-semibold text-ink">Darshan Engine</p>

      <dl className="mb-3 space-y-0.5 text-ink/70">
        <div className="flex justify-between gap-2">
          <dt>state</dt>
          <dd className="font-mono text-saffron">{engine.state}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>tier</dt>
          <dd className="font-mono">{engine.tier}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>energy</dt>
          <dd className="font-mono">{engine.energy.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>3D</dt>
          <dd className="font-mono">{String(engine.use3D)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>quote</dt>
          <dd className="font-mono">{engine.quote?.reference ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>mood</dt>
          <dd className="font-mono">{engine.mood.id}</dd>
        </div>
      </dl>

      <p className="mb-2 leading-snug text-ink/45">{engine.profile.description}</p>

      <div className="flex flex-wrap gap-1">
        {ALL_STATES.map((s) => (
          <button
            key={s}
            type="button"
            // Forced: the panel must be able to reach states the transition
            // table would refuse, which is the whole point of testing it.
            onClick={() => engine.setState(s, { force: true })}
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
              engine.state === s
                ? 'bg-saffron text-navy'
                : 'bg-saffron/10 text-ink/60 hover:bg-saffron/25'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-ink/35">{engine.capability.reason}</p>
    </div>
  )
}
