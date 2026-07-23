'use client'

/**
 * MotionPreferenceToggle — the seeker's own say over the experience.
 *
 * `prefers-reduced-motion` is an OS setting, and plenty of people who want a
 * calmer page have never found it. This exposes the same control in the product
 * and persists it (`user_motion_preferences`), where it outranks every other
 * signal in `detectCapability()` — including the OS.
 *
 * Four honest options rather than a single on/off:
 *   Automatic  — match my device and system settings
 *   Full       — the whole darshan, even on a modest device
 *   Calm       — no animation; everything still and readable
 *   Text only  — additionally drops decorative imagery
 *
 * Rendered as a plain radio group so it is keyboard-navigable and announces
 * correctly, which matters more here than anywhere else on the page.
 */

import { useDarshanOptional } from './DarshanProvider'
import type { MotionPreference } from '@/lib/darshan/types'

const OPTIONS: { value: MotionPreference; label: string; hint: string }[] = [
  { value: 'auto', label: 'Automatic', hint: 'Follow my device and system settings' },
  { value: 'full', label: 'Full darshan', hint: 'All motion and 3D, if my device allows' },
  { value: 'reduced', label: 'Calm', hint: 'Still and quiet — no animation' },
  { value: 'text-only', label: 'Text only', hint: 'Words alone, no decorative visuals' },
]

export default function MotionPreferenceToggle({
  className = '',
  tone = 'light',
}: {
  className?: string
  /** `dark` for the cosmic footer; `light` for the cream pages. */
  tone?: 'light' | 'dark'
}) {
  const engine = useDarshanOptional()
  // Without a provider there is nothing to configure — render nothing rather
  // than a control that silently does nothing.
  if (!engine) return null
  const dark = tone === 'dark'

  return (
    <fieldset className={className}>
      <legend className={`mb-2 text-xs font-medium uppercase tracking-[0.2em] ${dark ? 'text-moonlight/45' : 'text-ink/45'}`}>
        Motion
      </legend>
      <div className="flex flex-wrap justify-center gap-2">
        {OPTIONS.map((opt) => {
          const active = engine.motionPreference === opt.value
          return (
            <label
              key={opt.value}
              title={opt.hint}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? dark
                    ? 'border-gold bg-gold-soft/20 text-moonlight'
                    : 'border-saffron bg-saffron/15 text-ink'
                  : dark
                    ? 'border-white/15 text-moonlight/55 hover:border-gold/60 hover:text-moonlight/85'
                    : 'border-saffron/25 text-ink/55 hover:border-saffron/60 hover:text-ink/80'
              }`}
            >
              <input
                type="radio"
                name="darshan-motion"
                value={opt.value}
                checked={active}
                onChange={() => engine.setMotionPreference(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          )
        })}
      </div>
      <p className={`mt-2 text-[11px] ${dark ? 'text-moonlight/30' : 'text-ink/35'}`}>
        Currently: {engine.tier} — {engine.capability.reason}
      </p>
    </fieldset>
  )
}
