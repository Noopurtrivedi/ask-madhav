'use client'

/**
 * Dashavatar — the ten descents, as luminous silhouettes.
 *
 * This is what Vishwaroop resolves into: Arjuna asks to see the form that
 * contains all forms, and what opens is not one figure but the whole sequence —
 * fish, tortoise, boar, man-lion, dwarf, axe-bearer, archer, cowherd, the
 * awakened one, the rider yet to come.
 *
 * ── Drawn, not sourced ────────────────────────────────────────────────────
 * Every glyph below is vector geometry authored here. No downloaded deity art
 * enters the app (docs/DARSHAN.md § Asset licensing), and silhouettes keep the
 * treatment non-figurative: recognisable by attribute and posture rather than by
 * a rendered face, which is what lets the app show the sequence without claiming
 * to depict the deities.
 *
 * ── Ordering and naming are content, not code ─────────────────────────────
 * The list follows the Garuda Purana sequence, which is the most widely used —
 * but traditions differ (notably Balarama vs Buddha as the eighth or ninth).
 * `reviewer_note` records that openly rather than the codebase asserting one
 * tradition is correct, and the whole array is the seed for `avatar_forms`.
 */

export interface AvatarGlyph {
  id: string
  /** Devanagari name. */
  sanskrit: string
  /** Roman transliteration. */
  name: string
  /** What the descent is *for*, in one plain line. */
  meaning: string
  /** Notes for the cultural reviewer. */
  reviewer_note?: string
  draw: () => React.ReactNode
}

/* ── Glyphs ─────────────────────────────────────────────────────────────
   Each draws into a 100×100 box, centred on (50,50), filled by the parent
   so a single palette drives all ten. Kept to a handful of paths each: at
   the size these render, detail becomes mud. */

const Matsya = () => (
  <>
    {/* fish body + tail */}
    <path d="M20 50 C32 30 62 28 76 44 C82 50 82 50 76 56 C62 72 32 70 20 50 Z" />
    <path d="M76 44 L92 32 L88 50 L92 68 L76 56 Z" />
    <path d="M46 30 L52 18 L58 32 Z" />
    <circle cx="34" cy="46" r="3.2" fill="#05081C" />
  </>
)

const Kurma = () => (
  <>
    {/* tortoise shell + head + limbs */}
    <ellipse cx="50" cy="54" rx="30" ry="21" />
    <path d="M24 54 C24 40 36 32 50 32 C64 32 76 40 76 54 Z" />
    <ellipse cx="50" cy="30" rx="8" ry="7" />
    <ellipse cx="26" cy="70" rx="8" ry="5" transform="rotate(-24 26 70)" />
    <ellipse cx="74" cy="70" rx="8" ry="5" transform="rotate(24 74 70)" />
  </>
)

const Varaha = () => (
  <>
    {/* boar head in profile, tusk upturned, earth held above */}
    <path d="M22 62 C22 44 36 34 52 34 C66 34 76 42 78 54 L82 62 L74 66 C70 76 56 80 44 78 C30 76 22 70 22 62 Z" />
    <path d="M74 58 L86 46 L80 60 Z" />
    <circle cx="42" cy="50" r="3.2" fill="#05081C" />
    <circle cx="62" cy="20" r="10" fillOpacity="0.55" />
  </>
)

const Narasimha = () => (
  <>
    {/* maned lion head over a standing form */}
    <path d="M50 12 C68 12 80 26 80 42 C80 58 68 70 50 70 C32 70 20 58 20 42 C20 26 32 12 50 12 Z" />
    <ellipse cx="50" cy="42" rx="18" ry="19" fillOpacity="0.75" />
    <path d="M40 70 L60 70 L66 92 L34 92 Z" />
    {/* mane spikes */}
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * 360) / 12
      const r = (a * Math.PI) / 180
      return (
        <path
          key={i}
          d={`M${(50 + 28 * Math.cos(r)).toFixed(1)} ${(42 + 28 * Math.sin(r)).toFixed(1)}
              L${(50 + 38 * Math.cos(r)).toFixed(1)} ${(42 + 38 * Math.sin(r)).toFixed(1)}`}
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )
    })}
  </>
)

const Vamana = () => (
  <>
    {/* small figure with parasol and staff */}
    <ellipse cx="50" cy="44" rx="11" ry="12" />
    <path d="M40 58 L60 58 L64 86 L36 86 Z" />
    <path d="M22 30 C30 16 70 16 78 30 Z" />
    <rect x="48.5" y="28" width="3" height="20" />
    <rect x="72" y="44" width="3" height="44" transform="rotate(9 72 44)" />
  </>
)

const Parashurama = () => (
  <>
    {/* standing figure bearing an axe */}
    <ellipse cx="44" cy="26" rx="10" ry="11" />
    <path d="M34 40 L54 40 L58 74 L30 74 Z" />
    <path d="M34 78 L42 78 L40 94 L32 94 Z M46 78 L54 78 L56 94 L48 94 Z" />
    <rect x="68" y="18" width="4" height="72" transform="rotate(8 68 18)" />
    <path d="M60 20 C74 10 86 16 86 28 C78 30 68 28 62 30 Z" />
  </>
)

const Rama = () => (
  <>
    {/* archer, bow drawn */}
    <ellipse cx="46" cy="24" rx="10" ry="11" />
    <path d="M36 38 L56 38 L60 72 L32 72 Z" />
    <path d="M36 76 L44 76 L42 94 L34 94 Z M48 76 L56 76 L58 94 L50 94 Z" />
    {/* bow */}
    <path
      d="M78 12 C90 34 90 62 78 84"
      stroke="currentColor"
      strokeWidth="3.6"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M78 12 L70 48 L78 84" stroke="currentColor" strokeWidth="1.6" fill="none" />
    <path d="M52 48 L82 48" stroke="currentColor" strokeWidth="2.2" />
  </>
)

const Krishna = () => (
  <>
    {/* cowherd with flute, one leg crossed, peacock plume */}
    <ellipse cx="50" cy="26" rx="10" ry="11" />
    <path d="M42 12 C44 2 52 2 54 10 C50 8 46 10 42 12 Z" />
    <path d="M40 40 L60 40 L62 70 L38 70 Z" />
    <path d="M38 74 L52 74 L48 94 L36 94 Z" />
    <path d="M52 74 L62 74 L66 92 L54 92 Z" />
    {/* the flute, held across */}
    <rect x="26" y="42" width="48" height="3.6" rx="1.8" transform="rotate(-12 26 42)" />
  </>
)

const Buddha = () => (
  <>
    {/* seated in meditation, bodhi halo */}
    <circle cx="50" cy="40" r="30" fillOpacity="0.16" />
    <ellipse cx="50" cy="30" rx="11" ry="12" />
    <path d="M50 18 C52 12 48 12 50 18 Z" />
    <path d="M38 46 C38 40 62 40 62 46 L66 68 L34 68 Z" />
    {/* crossed legs */}
    <path d="M28 68 C36 82 64 82 72 68 C72 78 62 84 50 84 C38 84 28 78 28 68 Z" />
  </>
)

const Kalki = () => (
  <>
    {/* rider on a horse, blade raised — the descent still to come */}
    <path d="M18 66 C22 52 34 46 48 46 L66 46 C74 46 80 52 82 60 L84 74 L76 74 L72 62 L60 62 L56 74 L48 74 L46 62 L34 62 L30 74 L22 74 Z" />
    <path d="M66 46 L74 30 L86 26 L82 40 Z" />
    <ellipse cx="50" cy="30" rx="7" ry="8" />
    <path d="M44 40 L56 40 L58 48 L42 48 Z" />
    <path d="M62 12 L68 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </>
)

export const DASHAVATAR: AvatarGlyph[] = [
  { id: 'matsya', sanskrit: 'मत्स्य', name: 'Matsya', meaning: 'Rescues what must survive the flood.', draw: Matsya },
  { id: 'kurma', sanskrit: 'कूर्म', name: 'Kurma', meaning: 'Bears the weight so the churning can go on.', draw: Kurma },
  { id: 'varaha', sanskrit: 'वराह', name: 'Varaha', meaning: 'Lifts the earth back out of the deep.', draw: Varaha },
  { id: 'narasimha', sanskrit: 'नरसिंह', name: 'Narasimha', meaning: 'Neither man nor beast — the loophole justice needs.', draw: Narasimha },
  { id: 'vamana', sanskrit: 'वामन', name: 'Vamana', meaning: 'The smallest step that measures everything.', draw: Vamana },
  { id: 'parashurama', sanskrit: 'परशुराम', name: 'Parashurama', meaning: 'Clears what has grown tyrannical.', draw: Parashurama },
  { id: 'rama', sanskrit: 'राम', name: 'Rama', meaning: 'Holds his word when it costs him everything.', draw: Rama },
  { id: 'krishna', sanskrit: 'कृष्ण', name: 'Krishna', meaning: 'Speaks the Gita — and stays as the charioteer.', draw: Krishna },
  {
    id: 'buddha',
    sanskrit: 'बुद्ध',
    name: 'Buddha',
    meaning: 'Ends suffering by ending the grasping.',
    reviewer_note:
      'Traditions differ on the ninth descent — Balarama in several Vaishnava lists, Buddha in the Garuda Purana sequence used here. Editable in `avatar_forms`; not a claim by the app.',
    draw: Buddha,
  },
  { id: 'kalki', sanskrit: 'कल्कि', name: 'Kalki', meaning: 'The descent still to come.', draw: Kalki },
]

/** One glyph in its own luminous disc. */
export function AvatarGlyphIcon({
  glyph,
  size = 64,
  color = '#8FD3D8',
  active = true,
}: {
  glyph: AvatarGlyph
  size?: number
  color?: string
  active?: boolean
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        color,
        fill: color,
        opacity: active ? 1 : 0.2,
        transition: 'opacity 900ms ease-out',
        filter: active ? `drop-shadow(0 0 ${size * 0.14}px ${color}88)` : 'none',
      }}
    >
      {glyph.draw()}
    </svg>
  )
}
