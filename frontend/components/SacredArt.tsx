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
 * Drawn from the anatomy of a real feather rather than as a symbol, because the
 * symbolic version (a few straight lines and four flat ellipses) reads as
 * clip-art at any size:
 *
 *  · a **rachis** that curves — a dead-straight shaft is the first tell,
 *  · ~46 fine **barbs** per side, each an arc rather than a line, lengthening
 *    and steepening toward the tip so the plume widens into the eye, with
 *    per-barb opacity jitter so it never looks combed,
 *  · the **ocellus** built as the real one is: bronze fringe → gold → green →
 *    turquoise → a notched indigo heart, each ring offset slightly upward so
 *    the eye reads as domed rather than as flat rings,
 *  · a specular highlight, since the whole point of a peacock feather is that
 *    it is iridescent.
 *
 * Deterministic throughout (a hashed jitter, never `Math.random()`), so server
 * and client render identical markup.
 */
export function PeacockFeather({ className = '' }: { className?: string }) {
  const BARBS = 46
  const EYE_Y = 168

  // Deterministic jitter in [0,1) — keeps barbs from looking machined.
  //
  // Integer LCG, not `Math.sin`: ECMAScript leaves `Math.sin` precision
  // implementation-defined, so Node and the browser disagree around the 12th
  // decimal and every emitted coordinate becomes a hydration mismatch. Integer
  // arithmetic is exact everywhere. (Same reason CosmicBackdrop seeds its stars
  // this way.) Every coordinate below is also rounded before it reaches the DOM.
  const jitter = (i: number) => ((i * 1664525 + 1013904223) % 4294967296) / 4294967296

  const barb = (i: number, side: 1 | -1) => {
    const t = i / (BARBS - 1) // 0 at the base, 1 just below the eye
    const y = 600 - t * 400
    // Barbs lengthen toward the eye, so the plume opens into it.
    const len = 10 + Math.pow(t, 1.35) * 74 + jitter(i) * 6
    // …and sweep from near-horizontal at the base to steeply upswept at the tip.
    const angle = ((58 - t * 26) * Math.PI) / 180
    const dx = side * len * Math.sin(angle)
    const dy = len * Math.cos(angle)
    // Control point pulled outward gives each barb its natural bow.
    const cx = 100 + side * len * 0.72
    const cy = y - dy * 0.28
    return (
      <path
        key={`${side}-${i}`}
        d={`M100 ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${(100 + dx).toFixed(1)} ${(y - dy).toFixed(1)}`}
        strokeOpacity={(0.28 + t * 0.42 + jitter(i + 7) * 0.16).toFixed(2)}
        strokeWidth={(0.7 + t * 0.7).toFixed(2)}
      />
    )
  }

  return (
    <svg viewBox="0 0 200 620" className={className} aria-hidden="true">
      <defs>
        {/* Barbs shift green → gold along their length, as real barbules do. */}
        <linearGradient id="pankhBarb" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1F6B4F" />
          <stop offset="45%" stopColor="#3FA67E" />
          <stop offset="80%" stopColor="#8FC46A" />
          <stop offset="100%" stopColor="#D9C25E" />
        </linearGradient>
        <radialGradient id="pankhBronze" cx="50%" cy="56%" r="52%">
          <stop offset="60%" stopColor="#B98A3C" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#8A6428" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pankhGold" cx="50%" cy="54%" r="54%">
          <stop offset="0%" stopColor="#F0D67A" />
          <stop offset="100%" stopColor="#C79A3A" />
        </radialGradient>
        <radialGradient id="pankhGreen" cx="50%" cy="52%" r="56%">
          <stop offset="0%" stopColor="#5FBE7E" />
          <stop offset="100%" stopColor="#1E7A55" />
        </radialGradient>
        <radialGradient id="pankhTeal" cx="48%" cy="46%" r="60%">
          <stop offset="0%" stopColor="#3FC8D4" />
          <stop offset="100%" stopColor="#12707F" />
        </radialGradient>
        <radialGradient id="pankhHeart" cx="44%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#3A4FA8" />
          <stop offset="55%" stopColor="#152A6B" />
          <stop offset="100%" stopColor="#0A1436" />
        </radialGradient>
        <filter id="pankhSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>

      {/* Sparse, downy after-feather at the base */}
      <g
        stroke="#2F8F6B"
        strokeOpacity="0.22"
        strokeWidth="0.7"
        fill="none"
        filter="url(#pankhSoft)"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const y = 600 - i * 9
          // Rounded before it reaches the DOM — see the note on `jitter`.
          const w = +(16 + jitter(i) * 12).toFixed(1)
          const cw = +(w * 0.7).toFixed(1)
          return (
            <path
              key={`d${i}`}
              d={`M100 ${y} Q${100 - cw} ${y - 6} ${100 - w} ${y - 12}
                  M100 ${y} Q${100 + cw} ${y - 6} ${100 + w} ${y - 12}`}
            />
          )
        })}
      </g>

      {/* The plume */}
      <g stroke="url(#pankhBarb)" fill="none" strokeLinecap="round">
        {Array.from({ length: BARBS }, (_, i) => barb(i, -1))}
        {Array.from({ length: BARBS }, (_, i) => barb(i, 1))}
      </g>

      {/* Rachis — curved, pale, and tapering into the eye */}
      <path
        d="M100 612 C99 520 101 420 100 320 C99 250 100 200 100 176"
        stroke="#C8B87E"
        strokeOpacity="0.55"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── The ocellus ─────────────────────────────────────────
          Rings step upward as they narrow, so the eye domes toward
          the viewer instead of reading as concentric flat discs. */}
      <ellipse cx="100" cy={EYE_Y + 6} rx="60" ry="54" fill="url(#pankhBronze)" />
      <ellipse cx="100" cy={EYE_Y + 2} rx="46" ry="42" fill="url(#pankhGold)" fillOpacity="0.92" />
      <ellipse cx="100" cy={EYE_Y} rx="37" ry="34" fill="url(#pankhGreen)" />
      <ellipse cx="100" cy={EYE_Y - 2} rx="26" ry="25" fill="url(#pankhTeal)" />
      {/* The heart, notched at the top as a real ocellus is */}
      <path
        d={`M100 ${EYE_Y - 20}
            C112 ${EYE_Y - 26} 122 ${EYE_Y - 14} 122 ${EYE_Y - 2}
            C122 ${EYE_Y + 14} 110 ${EYE_Y + 24} 100 ${EYE_Y + 28}
            C90 ${EYE_Y + 24} 78 ${EYE_Y + 14} 78 ${EYE_Y - 2}
            C78 ${EYE_Y - 14} 88 ${EYE_Y - 26} 100 ${EYE_Y - 20}
            C100 ${EYE_Y - 20} 100 ${EYE_Y - 12} 100 ${EYE_Y - 8}
            C100 ${EYE_Y - 12} 100 ${EYE_Y - 20} 100 ${EYE_Y - 20} Z`}
        fill="url(#pankhHeart)"
      />
      {/* Iridescent specular — the reason a peacock feather is a peacock feather */}
      <ellipse
        cx="91"
        cy={EYE_Y - 10}
        rx="9"
        ry="6"
        fill="#EAF6FF"
        fillOpacity="0.3"
        transform={`rotate(-24 91 ${EYE_Y - 10})`}
      />
      <ellipse cx="100" cy={EYE_Y - 30} rx="22" ry="7" fill="#FFF3C4" fillOpacity="0.14" />
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
