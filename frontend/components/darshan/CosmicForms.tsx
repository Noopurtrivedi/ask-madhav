'use client'

import { useId } from 'react'


/**
 * CosmicForms — the divine form behind the figure, and the temple city below it.
 *
 * Both are drawn here as vectors rather than sourced as images. That is the
 * licensing guarantee the engine rests on (see docs/DARSHAN.md § Asset
 * licensing): the reference for this composition is a copyrighted production
 * still, so what is reproduced is the *technique* — a translucent luminous
 * silhouette rising behind a solid foreground figure, temple architecture
 * silhouetted along the base — never the artwork itself.
 *
 * Why silhouettes: a rendered divine face invites idol-dependency and would
 * claim to depict the deity. A luminous silhouette reads as presence — the form
 * *behind* the visible world — which is both what the reference achieves and
 * what the app's safety constraint permits.
 */

interface Props {
  className?: string
  /** Core luminance. */
  color?: string
  /** Outer nebula-side glow. */
  glow?: string
  opacity?: number
}

/**
 * DivineSilhouette — a four-armed standing form: crown, raised upper arms,
 * lowered lower arms, dhoti flare. Deliberately featureless (no face), heavily
 * softened, and always rendered translucent behind something solid.
 */
export function DivineSilhouette({
  className = '',
  color = '#7FD4D0',
  glow = '#3A4FA8',
  opacity = 0.62,
}: Props) {
  // SVG def ids are document-global. With the hero and the Vishwaroop overlay
  // both mounted, hardcoded ids collide and whichever renders second silently
  // paints with the *first* one's gradients — i.e. the colour props are
  // ignored. `useId` scopes them per instance.
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 400 560" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-divineBody`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="45%" stopColor={color} stopOpacity="0.62" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id={`${uid}-divineHalo`} cx="50%" cy="26%" r="58%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {/* Heavy blur is what turns a shape into a presence. */}
        <filter id={`${uid}-divineSoft`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id={`${uid}-divineSofter`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>

      <g opacity={opacity}>
        {/* Aura the form emerges out of */}
        <ellipse cx="200" cy="180" rx="190" ry="200" fill={`url(#${uid}-divineHalo)`} />

        {/* A softer copy behind the main body — depth, and it hides the edges */}
        <g filter={`url(#${uid}-divineSofter)`} opacity="0.55">
          <BodyPaths />
        </g>

        <g fill={`url(#${uid}-divineBody)`} filter={`url(#${uid}-divineSoft)`}>
          <BodyPaths />
        </g>

        {/* Crown finial spark */}
        <circle cx="200" cy="26" r="7" fill={color} fillOpacity="0.75" filter={`url(#${uid}-divineSoft)`} />
      </g>
    </svg>
  )
}

/**
 * The figure itself, factored out so the blurred backing copy and the sharper
 * front copy stay in sync — two draws of one silhouette.
 */
function BodyPaths() {
  return (
    <>
      {/* Kirita mukuta — the tall crown */}
      <path d="M170 104 L180 48 Q200 16 220 48 L230 104 Z" />
      {/* Head */}
      <ellipse cx="200" cy="126" rx="27" ry="31" />
      {/* Neck + shoulders */}
      <path d="M186 150 L214 150 L226 172 L174 172 Z" />
      {/* Torso, tapering to the waist */}
      <path d="M152 172 L248 172 L236 296 L164 296 Z" />

      {/* Upper arms, raised outward and open — a gesture of blessing, not force */}
      <path d="M158 178 L118 128 Q96 100 82 84 L98 72 Q120 96 138 122 L172 176 Z" />
      <path d="M242 178 L282 128 Q304 100 318 84 L302 72 Q280 96 262 122 L228 176 Z" />
      {/* Open hands */}
      <ellipse cx="86" cy="74" rx="15" ry="18" transform="rotate(-28 86 74)" />
      <ellipse cx="314" cy="74" rx="15" ry="18" transform="rotate(28 314 74)" />

      {/* Lower arms, resting downward */}
      <path d="M156 196 L124 246 Q112 282 108 312 L126 316 Q132 284 142 254 L174 204 Z" />
      <path d="M244 196 L276 246 Q288 282 292 312 L274 316 Q268 284 258 254 L226 204 Z" />
      <ellipse cx="117" cy="322" rx="13" ry="16" />
      <ellipse cx="283" cy="322" rx="13" ry="16" />

      {/* Dhoti, flaring into the light rather than ending in feet */}
      <path d="M164 296 L236 296 L258 442 Q200 470 142 442 Z" />
    </>
  )
}

/**
 * TempleSkyline — a city of shikharas along the foreground.
 *
 * Curvilinear Nagara-style spires with amalaka discs and finials, flanking
 * mandapa roofs, and a pair of deep-stambha lamp pillars. Rendered as a near-
 * black silhouette with a warm rim, so it sits in front of the cosmos the way
 * the reference does — the world in the foreground, the vastness behind it.
 */
export function TempleSkyline({
  className = '',
  color = '#05081C',
  rim = '#E8C35A',
}: {
  className?: string
  color?: string
  rim?: string
}) {
  const uid = useId().replace(/:/g, '')
  /** One curvilinear shikhara (temple spire) at x, of a given height/width. */
  const shikhara = (x: number, h: number, w: number, key: string) => {
    const base = 260
    const top = base - h
    return (
      <g key={key}>
        {/* the curved tower */}
        <path
          d={`M${x - w} ${base}
              C${x - w * 0.92} ${base - h * 0.5} ${x - w * 0.42} ${top + h * 0.16} ${x} ${top}
              C${x + w * 0.42} ${top + h * 0.16} ${x + w * 0.92} ${base - h * 0.5} ${x + w} ${base} Z`}
        />
        {/* amalaka + finial */}
        <ellipse cx={x} cy={top - 5} rx={w * 0.26} ry={w * 0.12} />
        <rect x={x - 1.6} y={top - 22} width="3.2" height="16" />
        <circle cx={x} cy={top - 24} r={w * 0.09} />
        {/* plinth */}
        <rect x={x - w * 1.22} y={base - 16} width={w * 2.44} height="16" />
      </g>
    )
  }

  /** A pillared mandapa roof — the flat-topped halls between the spires. */
  const mandapa = (x: number, w: number, h: number, key: string) => (
    <g key={key}>
      <path d={`M${x - w} 260 L${x - w} ${260 - h} L${x - w * 0.72} ${260 - h - 14} L${x + w * 0.72} ${260 - h - 14} L${x + w} ${260 - h} L${x + w} 260 Z`} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={x - w + 6 + i * ((w * 2 - 12) / 4)} y={260 - h + 6} width="4" height={h - 6} />
      ))}
    </g>
  )

  /** Deep-stambha — the brass lamp pillars that flank a temple entrance. */
  const lampPillar = (x: number, key: string) => (
    <g key={key}>
      <rect x={x - 5} y="150" width="10" height="110" />
      {[168, 196, 224].map((y) => (
        <ellipse key={y} cx={x} cy={y} rx="20" ry="5.5" />
      ))}
      <ellipse cx={x} cy="146" rx="11" ry="7" />
      <rect x={x - 22} y="252" width="44" height="8" />
    </g>
  )

  return (
    <svg viewBox="0 0 1200 260" className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-templeRim`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={rim} stopOpacity="0.5" />
          <stop offset="30%" stopColor={rim} stopOpacity="0.06" />
          <stop offset="100%" stopColor={rim} stopOpacity="0" />
        </linearGradient>
      </defs>

      <g fill={color}>
        {mandapa(90, 86, 74, 'm1')}
        {shikhara(232, 196, 46, 's1')}
        {mandapa(360, 70, 58, 'm2')}
        {lampPillar(470, 'l1')}
        {/* the principal temple, tallest and central */}
        {shikhara(600, 244, 62, 's-main')}
        {lampPillar(730, 'l2')}
        {mandapa(840, 70, 58, 'm3')}
        {shikhara(968, 196, 46, 's2')}
        {mandapa(1110, 86, 74, 'm4')}
        {/* the ground the city stands on */}
        <rect x="0" y="252" width="1200" height="8" />
      </g>

      {/* Warm rim so the silhouette is lit from the cosmos behind it */}
      <g fill={`url(#${uid}-templeRim)`} opacity="0.9">
        {shikhara(232, 196, 46, 'r-s1')}
        {shikhara(600, 244, 62, 'r-main')}
        {shikhara(968, 196, 46, 'r-s2')}
      </g>
    </svg>
  )
}

/**
 * VishwaroopForm — the cosmic form itself, as Arjuna was shown it.
 *
 * The climax the Dashavatar builds to: the same faceless silhouette, but now
 * many-armed and radiant, arms fanning around the torso like a corona. Many
 * arms is the universally-read signature of Vishwaroop, and — unlike multiplied
 * faces or devouring mouths — it carries awe without horror, which is the line
 * this app must not cross (docs/DARSHAN.md § What Vishwaroop must never become).
 *
 * `intensity` (0→1) drives how far the arms extend and how hot the corona
 * burns, so the parent can *manifest* it rather than switch it on.
 */
export function VishwaroopForm({
  className = '',
  color = '#BFB6FF',
  glow = '#D4A017',
  intensity = 1,
}: Props & { intensity?: number }) {
  const uid = useId().replace(/:/g, '')
  const k = Math.max(0, Math.min(1, intensity))

  // Arms fan through the upper hemisphere, longest at the sides, so the corona
  // reads as opening outward rather than as a wheel.
  const ARMS = 14
  const arms = Array.from({ length: ARMS }, (_, i) => {
    const spread = 200 // degrees of fan, centred on straight up
    const deg = -90 - spread / 2 + (i / (ARMS - 1)) * spread
    const rad = (deg * Math.PI) / 180
    const reach = (120 + 90 * k) * (0.72 + 0.28 * Math.abs(Math.cos(rad)))
    const ox = 200 + Math.cos(rad) * 34
    const oy = 210 + Math.sin(rad) * 20
    const ex = +(ox + Math.cos(rad) * reach).toFixed(1)
    const ey = +(oy + Math.sin(rad) * reach).toFixed(1)
    const w = 9 - (i % 3) * 1.4
    const nx = -Math.sin(rad) * w
    const ny = Math.cos(rad) * w
    return (
      <g key={i}>
        <path
          d={`M${(ox + nx).toFixed(1)} ${(oy + ny).toFixed(1)}
              L${(ex + nx * 0.32).toFixed(1)} ${(ey + ny * 0.32).toFixed(1)}
              L${(ex - nx * 0.32).toFixed(1)} ${(ey - ny * 0.32).toFixed(1)}
              L${(ox - nx).toFixed(1)} ${(oy - ny).toFixed(1)} Z`}
        />
        <ellipse cx={ex} cy={ey} rx={7.5} ry={9} transform={`rotate(${deg + 90} ${ex} ${ey})`} />
      </g>
    )
  })

  return (
    <svg viewBox="0 0 400 560" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-corona`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity={0.5 * k} />
          <stop offset="45%" stopColor={color} stopOpacity={0.24 * k} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-limb`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.9" />
          <stop offset="60%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0.25" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`${uid}-bloom`} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="17" />
        </filter>
      </defs>

      {/* Corona the whole form burns inside */}
      <ellipse cx="200" cy="230" rx="230" ry="250" fill={`url(#${uid}-corona)`} />

      <g fill={`url(#${uid}-limb)`}>
        <g filter={`url(#${uid}-bloom)`} opacity={0.5 * k}>
          {arms}
        </g>
        <g filter={`url(#${uid}-soft)`} opacity={0.42 + 0.5 * k}>
          {arms}
        </g>
      </g>

      {/* The body at the heart of it */}
      <g fill={`url(#${uid}-limb)`} filter={`url(#${uid}-soft)`} opacity={0.6 + 0.4 * k}>
        <BodyPaths />
      </g>
      <circle cx="200" cy="26" r={7 + 5 * k} fill={glow} fillOpacity={0.8 * k} filter={`url(#${uid}-soft)`} />
    </svg>
  )
}

/**
 * ArjunaWitness — the one being shown.
 *
 * A small kneeling silhouette at the foot of the reveal, hands folded, bow set
 * down. It gives the cosmic form a *scale*: without a human figure in frame,
 * "vast" is just "large". This is the Kurukshetra moment of Chapter 11.
 */
export function ArjunaWitness({
  className = '',
  color = '#05081C',
  rim = '#E8C35A',
}: {
  className?: string
  color?: string
  rim?: string
}) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 200 130" className={className} aria-hidden="true">
      <defs>
        {/* A pure dark silhouette is invisible against a dark sky. The rim is
            what makes him readable — and it reads as the cosmic form's light
            falling on him, which is exactly the moment being depicted. */}
        <linearGradient id={`${uid}-rim`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={rim} stopOpacity="0.85" />
          <stop offset="55%" stopColor={rim} stopOpacity="0.25" />
          <stop offset="100%" stopColor={rim} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g fill={`url(#${uid}-rim)`} transform="translate(0,-2.5)">
        {/* the bow, laid down */}
        <path
          d="M34 120 C22 100 22 74 34 54"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* kneeling body, head bowed */}
        <ellipse cx="104" cy="48" rx="12" ry="13" />
        <path d="M92 62 C92 58 116 58 116 62 L122 96 L86 96 Z" />
        {/* folded hands raised before the chest */}
        <path d="M104 66 L112 78 L104 88 L96 78 Z" />
        {/* the kneel */}
        <path d="M86 96 L122 96 L138 122 L74 122 Z" />
      </g>
      {/* the solid body, drawn over the rim so only its edge catches the light */}
      <g fill={color}>
        <path
          d="M34 120 C22 100 22 74 34 54"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="104" cy="48" rx="12" ry="13" />
        <path d="M92 62 C92 58 116 58 116 62 L122 96 L86 96 Z" />
        <path d="M104 66 L112 78 L104 88 L96 78 Z" />
        <path d="M86 96 L122 96 L138 122 L74 122 Z" />
      </g>
    </svg>
  )
}
