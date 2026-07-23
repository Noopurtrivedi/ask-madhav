/**
 * SacredArt — hand-crafted SVG artwork themed to the Bhagavad Gita / Krishna
 * (peacock feather, lotus, radiant sun, drifting petals). Pure vector, no
 * external images, so it's license-clean and crisp at any size.
 */

/** Soft radiant sun rays — sits behind the hero avatar. */
export function SunRays({ className = '' }: { className?: string }) {
  const rays = Array.from({ length: 24 }, (_, i) => i * 15)
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6D27A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8A620" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke="#E8A620" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round">
        {rays.map((deg) => (
          <line
            key={deg}
            x1="200"
            y1="200"
            x2={200 + 190 * Math.cos((deg * Math.PI) / 180)}
            y2={200 + 190 * Math.sin((deg * Math.PI) / 180)}
          />
        ))}
      </g>
      <circle cx="200" cy="200" r="150" fill="url(#sunCore)" />
    </svg>
  )
}

/**
 * Mor pankh — Krishna's peacock feather.
 *
 * Modelled on a real feather rather than on the symbol, which is why it is
 * built the way it is:
 *
 *  · **Sparse barbs, not a plume.** ~24 per side, widely spaced, so the
 *    background shows *between* them. A dense fill is the single thing that
 *    makes a drawn feather read as clip-art.
 *  · **Long and swept.** Each barb is an arc that leaves the shaft at a shallow
 *    angle and sweeps up and outward, longest just below the eye, tapering to
 *    the tip at the base — the lance shape a real tail feather has.
 *  · **Bronze, not green.** The barbs run copper → gold; the green belongs to
 *    the ocellus, not the shaft.
 *  · **A large ocellus**, ringed as the real one is: copper → green → cyan →
 *    a notched navy heart, with a specular highlight, since iridescence is the
 *    entire point of a peacock feather.
 *
 * Deterministic throughout (integer LCG, never `Math.sin`) and every coordinate
 * is rounded before it reaches the DOM — `Math.sin` precision is
 * implementation-defined, so seeding with it makes server and client disagree
 * and produces a hydration mismatch on every load.
 */
export function PeacockFeather({ className = '' }: { className?: string }) {
  const BARBS = 24
  const EYE_Y = 150

  const jitter = (i: number) => ((i * 1664525 + 1013904223) % 4294967296) / 4294967296

  const barb = (i: number, side: 1 | -1) => {
    const t = i / (BARBS - 1) // 0 at the base tip, 1 just below the eye
    const y = 600 - t * 372
    // Longest just under the eye; the plume tapers to a point at the base.
    const len = 14 + Math.pow(t, 0.78) * 92 + jitter(i) * 9
    // Shallower sweep near the eye, steeper down at the tip.
    const angle = ((62 - t * 22) * Math.PI) / 180
    const ex = +(100 + side * len * Math.sin(angle)).toFixed(1)
    const ey = +(y - len * Math.cos(angle)).toFixed(1)
    // Two control points give the barb its S-bow: out from the shaft, then up.
    const c1x = +(100 + side * len * 0.34).toFixed(1)
    const c1y = +(y - len * 0.06).toFixed(1)
    const c2x = +(100 + side * len * 0.92).toFixed(1)
    const c2y = +(y - len * 0.46).toFixed(1)
    return (
      <path
        key={`${side}-${i}`}
        d={`M100 ${y.toFixed(1)} C${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`}
        strokeOpacity={(0.42 + t * 0.4).toFixed(2)}
        strokeWidth={(1 + t * 1.1).toFixed(2)}
      />
    )
  }

  return (
    <svg viewBox="0 0 200 620" className={className} aria-hidden="true">
      <defs>
        {/* Copper at the shaft, warm gold at the tips. */}
        <linearGradient id="pankhBarb" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7A5A2E" />
          <stop offset="50%" stopColor="#A8802F" />
          <stop offset="100%" stopColor="#E0C070" />
        </linearGradient>
        <radialGradient id="pankhOuter" cx="50%" cy="52%" r="52%">
          <stop offset="62%" stopColor="#C2762F" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8A5220" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pankhCopper" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stopColor="#E08A3C" />
          <stop offset="100%" stopColor="#A85A22" />
        </radialGradient>
        <radialGradient id="pankhGreen" cx="50%" cy="50%" r="56%">
          <stop offset="0%" stopColor="#6FBF4A" />
          <stop offset="100%" stopColor="#2E7A34" />
        </radialGradient>
        <radialGradient id="pankhCyan" cx="46%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#3FC4EC" />
          <stop offset="100%" stopColor="#1373B4" />
        </radialGradient>
        <radialGradient id="pankhHeart" cx="42%" cy="34%" r="76%">
          <stop offset="0%" stopColor="#2B3F8F" />
          <stop offset="55%" stopColor="#122A66" />
          <stop offset="100%" stopColor="#0A1330" />
        </radialGradient>
      </defs>

      {/* The plume — sparse enough to see between */}
      <g stroke="url(#pankhBarb)" fill="none" strokeLinecap="round">
        {Array.from({ length: BARBS }, (_, i) => barb(i, -1))}
        {Array.from({ length: BARBS }, (_, i) => barb(i, 1))}
      </g>

      {/* Rachis — a pale hairline, visible the whole way down */}
      <path
        d="M100 606 C99 520 101 420 100 320 C99 250 100 205 100 186"
        stroke="#EADFBE"
        strokeOpacity="0.5"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── The ocellus ───────────────────────────────────────── */}
      <ellipse cx="100" cy={EYE_Y + 4} rx="62" ry="58" fill="url(#pankhOuter)" />
      <ellipse cx="100" cy={EYE_Y + 2} rx="47" ry="44" fill="url(#pankhCopper)" />
      <ellipse cx="100" cy={EYE_Y} rx="36" ry="34" fill="url(#pankhGreen)" />
      <ellipse cx="100" cy={EYE_Y - 2} rx="25" ry="25" fill="url(#pankhCyan)" />
      {/* The heart, notched at the top as a real ocellus is */}
      <path
        d={`M100 ${EYE_Y - 18}
            C111 ${EYE_Y - 25} 121 ${EYE_Y - 13} 121 ${EYE_Y - 1}
            C121 ${EYE_Y + 13} 109 ${EYE_Y + 23} 100 ${EYE_Y + 27}
            C91 ${EYE_Y + 23} 79 ${EYE_Y + 13} 79 ${EYE_Y - 1}
            C79 ${EYE_Y - 13} 89 ${EYE_Y - 25} 100 ${EYE_Y - 18}
            C100 ${EYE_Y - 14} 100 ${EYE_Y - 10} 100 ${EYE_Y - 7}
            C100 ${EYE_Y - 12} 100 ${EYE_Y - 16} 100 ${EYE_Y - 18} Z`}
        fill="url(#pankhHeart)"
      />
      <ellipse
        cx="90"
        cy={EYE_Y - 9}
        rx="8"
        ry="5"
        fill="#EAF6FF"
        fillOpacity="0.34"
        transform={`rotate(-26 90 ${EYE_Y - 9})`}
      />
    </svg>
  )
}

/** Concentric lotus mandala — works as a faint background motif. */
export function LotusMandala({ className = '' }: { className?: string }) {
  const petal = (rot: number, scale: number, opacity: number) => (
    <path
      key={`${rot}-${scale}`}
      d="M200 200 C214 150 214 110 200 60 C186 110 186 150 200 200 Z"
      fill="#E8A620"
      fillOpacity={opacity}
      transform={`rotate(${rot} 200 200) scale(${scale})`}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  )
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g style={{ transformOrigin: '200px 200px' }}>
        {Array.from({ length: 12 }, (_, i) => petal(i * 30, 1, 0.10))}
        {Array.from({ length: 12 }, (_, i) => petal(i * 30 + 15, 0.7, 0.14))}
      </g>
      <circle cx="200" cy="200" r="20" fill="#E8A620" fillOpacity="0.25" />
    </svg>
  )
}

/** A single lotus petal (used for floating petals). */
function Petal({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 36" className={className} style={style} aria-hidden="true">
      <path
        d="M12 0 C19 12 19 24 12 36 C5 24 5 12 12 0 Z"
        fill="#F0B830"
        fillOpacity="0.55"
        stroke="#E8A620"
        strokeOpacity="0.4"
      />
    </svg>
  )
}

/** Decorative petals slowly drifting down the hero. */
export function FloatingPetals() {
  const petals = [
    { left: '8%', size: 18, delay: '0s', dur: '17s' },
    { left: '22%', size: 12, delay: '6s', dur: '21s' },
    { left: '41%', size: 22, delay: '3s', dur: '15s' },
    { left: '63%', size: 14, delay: '9s', dur: '23s' },
    { left: '78%', size: 20, delay: '1.5s', dur: '18s' },
    { left: '90%', size: 12, delay: '7s', dur: '20s' },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {petals.map((p, i) => (
        <Petal
          key={i}
          style={{
            position: 'absolute',
            top: '-6%',
            left: p.left,
            width: p.size,
            height: p.size * 1.5,
            animation: `drift ${p.dur} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}
