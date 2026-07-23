'use client'

import { LotusMandala } from '../SacredArt'

/**
 * CosmicBackdrop — the sky Madhav is seen against.
 *
 * Deep indigo → peacock blue → cosmic violet, with sacred geometry (a slowly
 * turning lotus mandala and two dashed orbit rings), a low gold horizon glow,
 * and a quiet field of stars. Everything is CSS/SVG — no images, no canvas —
 * so it costs nothing to load and stays crisp at any size.
 *
 * The star field is generated from a fixed seed rather than `Math.random()`
 * so the server and client render byte-identical markup (no hydration drift).
 */

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const STARS = (() => {
  const rand = seeded(20470428)
  return Array.from({ length: 46 }, () => ({
    left: +(rand() * 100).toFixed(2),
    top: +(rand() * 92).toFixed(2),
    size: +(0.9 + rand() * 1.9).toFixed(2),
    delay: +(rand() * 6).toFixed(2),
    dur: +(3.2 + rand() * 4).toFixed(2),
    opacity: +(0.25 + rand() * 0.5).toFixed(2),
  }))
})()

export default function CosmicBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base cosmos */}
      <div className="absolute inset-0 cosmos-base" />

      {/* Peacock-blue nebula + gold horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 620px at 72% 18%, rgba(31, 122, 140, 0.30), transparent 62%),' +
            'radial-gradient(760px 520px at 16% 30%, rgba(88, 52, 148, 0.32), transparent 66%),' +
            'radial-gradient(1200px 420px at 50% 104%, rgba(232, 166, 32, 0.26), transparent 70%)',
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star absolute rounded-full bg-moonlight"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              ['--star-min' as string]: `${s.opacity}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Sacred geometry — a lotus mandala turning behind the darshan */}
      <LotusMandala className="absolute left-1/2 top-[42%] w-[1100px] h-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-[0.10] mandala-turn" />

      {/* Two orbit rings, counter-turning */}
      <svg
        viewBox="0 0 400 400"
        className="absolute left-1/2 top-[42%] w-[820px] h-[820px] -translate-x-1/2 -translate-y-1/2 mandala-turn-slow"
      >
        <circle cx="200" cy="200" r="176" fill="none" stroke="#E8C35A" strokeOpacity="0.16" strokeWidth="0.6" strokeDasharray="2 12" />
        <circle cx="200" cy="200" r="148" fill="none" stroke="#7FD4D0" strokeOpacity="0.10" strokeWidth="0.6" strokeDasharray="1 9" />
      </svg>

      {/* Dissolve into the warm page below */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#5B3A5B]/25 to-[#F3E7CD]" />
    </div>
  )
}
