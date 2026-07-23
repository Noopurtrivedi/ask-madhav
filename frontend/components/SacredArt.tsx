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

/** Stylised peacock feather — Krishna's emblem. */
export function PeacockFeather({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 220" className={className} aria-hidden="true">
      <path d="M40 220 C40 150 40 110 40 70" stroke="#2F8F6B" strokeWidth="2" fill="none" />
      {/* plume barbs */}
      <g stroke="#3FA67E" strokeOpacity="0.5" strokeWidth="1">
        {Array.from({ length: 18 }, (_, i) => {
          const y = 70 + i * 5
          const w = 26 - i * 0.8
          return <line key={i} x1={40 - w} y1={y + 6} x2={40} y2={y} />
        })}
        {Array.from({ length: 18 }, (_, i) => {
          const y = 70 + i * 5
          const w = 26 - i * 0.8
          return <line key={`r${i}`} x1={40 + w} y1={y + 6} x2={40} y2={y} />
        })}
      </g>
      {/* the eye */}
      <ellipse cx="40" cy="44" rx="30" ry="40" fill="#1E6F8F" fillOpacity="0.85" />
      <ellipse cx="40" cy="46" rx="22" ry="30" fill="#2F8F6B" fillOpacity="0.9" />
      <ellipse cx="40" cy="50" rx="14" ry="20" fill="#0E3A66" />
      <ellipse cx="40" cy="50" rx="8" ry="13" fill="#E8A620" />
      <ellipse cx="40" cy="52" rx="4" ry="7" fill="#7A1F4F" />
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
