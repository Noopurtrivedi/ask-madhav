'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import ChakraLaunch from './darshan/ChakraLaunch'
import EngineChakra from './darshan/EngineChakra'
import GalaxyCanvas, { type GalaxyDrive } from './darshan/GalaxyCanvas'
import { useDarshanOptional } from './darshan/DarshanProvider'
import { useReducedMotion } from '@/lib/motion'
import { darshanNotReady, isDarshanReady, subscribeDarshanReady } from '@/lib/darshan-launch'

const ENTRY_POINTS = [
  { label: 'Walk a path', href: '#paths' },
  { label: "Today's shloka", href: '#daily-verse' },
  { label: '18 chapters', href: '#chapters' },
  { label: 'Stories', href: '#stories' },
]

// One tap from the hero to a real answer — the questions people most often bring.
const STARTERS = ['I feel anxious about the future', 'I am afraid of failing', 'What is my purpose?']

// The opening painting, and where Krishna's raised fingertip sits in it
// (as fractions of the image) — the Sudarshan Chakra forms just above it.
const ART = { src: '/art/scene-1.png', w: 1122, h: 1402, fx: 0.488, fy: 0.425 }

/** Hand a question to the chat below and send it there. */
function askMadhav(raw: string) {
  const question = raw.trim()
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  if (!question) return
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question, send: true } }))
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * Hero — the Darshan, told as one scroll-driven film in three acts.
 *
 *  I.   **The field.** The Kurukshetra painting, full-bleed, with the Sudarshan
 *       Chakra forming on Krishna's raised fingertip. The headline and the ask
 *       bar live here.
 *  II.  **The dive.** Scrolling pushes the camera toward the fingertip: the
 *       painting zooms and blurs past, the chakra grows and turns faster —
 *       "a single verse changes everything".
 *  III. **Vishwaroop.** A flash of light, and a galaxy bursts out of the
 *       chakra's centre — the universe in one form (Gita 11.7).
 *
 * The section is tall and the stage is sticky; one rAF-throttled scroll
 * listener turns scroll position into a handful of CSS variables on the stage,
 * so the whole film runs on transform/opacity/filter with no React renders.
 * The chakra stays engine-driven (it races while Madhav thinks) except during
 * the dive, where it is pinned to `processing`.
 *
 * Still counterpart: under reduced motion (or the `still` tier) there is no
 * pinning and no film — Act I as a normal hero, then Act III as a quiet block.
 * The launch ritual still unveils Act I; a 9s failsafe reveals it regardless.
 */
export default function Hero() {
  const landed = useSyncExternalStore(subscribeDarshanReady, isDarshanReady, darshanNotReady)
  const [failsafe, setFailsafe] = useState(false)
  useEffect(() => {
    // Must outlast the launch ritual (~7s) — a failsafe, not a schedule.
    const t = window.setTimeout(() => setFailsafe(true), 9000)
    return () => clearTimeout(t)
  }, [])
  const revealed = landed || failsafe

  const [question, setQuestion] = useState('')
  const engine = useDarshanOptional()
  const reduced = useReducedMotion()
  const still = reduced || engine?.tier === 'still'
  const starCount = engine?.tier === 'lite' ? 1800 : 4200

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const galaxy = useRef<GalaxyDrive>({ burst: 0, active: false })
  const [diving, setDiving] = useState(false)

  // ── Frame the painting so the fingertip lands where the composition wants it
  //    (right of centre on desktop, upper-centre on a phone), and tell the stage
  //    where that is so the zoom origin and the chakra sit on it exactly.
  useEffect(() => {
    const stage = stageRef.current
    const art = artRef.current
    if (!stage || !art) return
    const layout = () => {
      const W = stage.clientWidth
      const H = stage.clientHeight
      const wide = W >= 1024
      // Desktop: the painting owns the right two-thirds and its left edge is
      // feathered into the dark (see .journey-art-feather), so the fingertip
      // sits clear of the headline. Phones: cover, a little larger, so the
      // fingertip can rise above the copy at the bottom of the frame.
      const s = wide ? Math.max((H * 1.25) / ART.h, (W * 0.6) / ART.w) : Math.max(W / ART.w, H / ART.h) * 1.25
      const dw = ART.w * s
      const dh = ART.h * s
      const wantX = wide ? 0.68 : 0.56
      const wantY = wide ? 0.42 : 0.24
      const left = Math.min(wide ? W : 0, Math.max(W - dw, W * wantX - ART.fx * dw))
      const top = Math.min(0, Math.max(H - dh, H * wantY - ART.fy * dh))
      art.classList.toggle('journey-art-feather', wide && left > 0)
      Object.assign(art.style, { left: `${left}px`, top: `${top}px`, width: `${dw}px`, height: `${dh}px` })
      stage.style.setProperty('--fx', `${left + ART.fx * dw}px`)
      stage.style.setProperty('--fy', `${top + ART.fy * dh}px`)
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  // ── The film: scroll → CSS variables, once per frame at most.
  useEffect(() => {
    if (still) return
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return
    let raf = 0
    let inView = true
    let wasDiving = false
    const set = (k: string, v: number) => stage.style.setProperty(k, v.toFixed(4))

    const update = () => {
      raf = 0
      const rect = section.getBoundingClientRect()
      const total = Math.max(1, rect.height - window.innerHeight)
      const p = clamp01(-rect.top / total)
      const t = smooth(0.06, 0.5, p)

      set('--zoom', 1 + 1.55 * t)
      set('--blur', 12 * smooth(0.3, 0.52, p))
      set('--art', 1 - smooth(0.44, 0.58, p))
      set('--cs', 0.12 + 4.6 * t * t * t)
      set('--ca', 1 - smooth(0.5, 0.6, p))
      set('--flash', Math.max(0, 1 - Math.abs(p - 0.53) / 0.08))
      set('--b1', 1 - smooth(0.04, 0.14, p))
      set('--b2', smooth(0.17, 0.24, p) * (1 - smooth(0.38, 0.45, p)))
      set('--b3', smooth(0.7, 0.8, p))
      set('--gal', smooth(0.47, 0.58, p))
      stage.dataset.act = p < 0.12 ? '1' : p > 0.68 ? '3' : '2'

      const burst = smooth(0.5, 0.72, p)
      galaxy.current.burst = 1 - Math.pow(1 - burst, 3)
      galaxy.current.active = inView && p > 0.44

      const nowDiving = p > 0.1 && p < 0.6
      if (nowDiving !== wasDiving) {
        wasDiving = nowDiving
        setDiving(nowDiving)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      onScroll()
    })
    io.observe(section)
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [still])

  return (
    <>
      <ChakraLaunch />

      <section id="darshan" ref={sectionRef} className={`journey ${still ? 'journey-still' : ''}`}>
        <div ref={stageRef} className="journey-stage" data-act="1">
          {/* ── Act I/II: the painting, zooming toward the fingertip ── */}
          <div className="journey-art-zoom" aria-hidden="true">
            <div ref={artRef} className="absolute">
              <Image src={ART.src} alt="" fill priority sizes="(min-width: 1024px) 100vw, 160vw" className="object-cover" />
            </div>
          </div>
          <div className="journey-shade" aria-hidden="true" />

          {/* The Sudarshan Chakra on Krishna's fingertip — the door we dive through. */}
          <div className="journey-chakra" aria-hidden="true">
            <div className="journey-chakra-glow" />
            <EngineChakra size={600} override={diving ? 'processing' : undefined} />
          </div>

          {/* ── Act III: the universe in one form ── */}
          {!still && (
            <div className="journey-galaxy" aria-hidden="true">
              <GalaxyCanvas drive={galaxy} count={starCount} />
            </div>
          )}
          <div className="journey-flash" aria-hidden="true" />

          {/* ── Act I copy: the word and the invitation ── */}
          <div className="journey-beat journey-beat-1">
            <div
              className={`journey-copy transition-[opacity,transform] duration-1000 ease-out ${
                revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <p className="eyebrow mb-6">The Bhagavad Gita · 700 Verses</p>
              <h1 className="hero-title mb-6">
                Seek wisdom.
                <br />
                <em className="shimmer-text">Find peace.</em>
              </h1>
              <p className="mb-8 max-w-[33rem] text-base leading-[1.8] text-moonlight/80 md:text-[1.075rem]">
                Bring the question you carry. Madhav answers from the Bhagavad Gita &mdash; one verse,
                one truth, and one step you can take today.
              </p>

              {/* Ask from the first frame: the question goes straight to the
                  chat below (`madhav:prefill` with send) — no second step. */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  askMadhav(question)
                }}
                className="ask-bar max-w-[34rem]"
              >
                <label htmlFor="hero-ask" className="sr-only">
                  Ask Madhav a question
                </label>
                <input
                  id="hero-ask"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={1000}
                  placeholder="What weighs on your heart?"
                  className="min-w-0 flex-1 bg-transparent py-3 text-[0.95rem] text-moonlight placeholder:text-moonlight/45 focus:outline-none"
                />
                <button type="submit" className="btn-leaf shrink-0 px-5 py-3 sm:px-6">
                  <span className="sm:hidden">Ask</span>
                  <span className="hidden sm:inline">Ask Madhav</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => askMadhav(s)}
                    className="rounded-full border border-white/15 bg-black/25 px-3.5 py-1.5 text-xs text-moonlight/75 backdrop-blur-sm transition-colors hover:border-gold-soft/60 hover:text-moonlight"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <nav aria-label="Other ways in" className="mt-8 hidden flex-wrap items-center gap-x-6 gap-y-3 sm:flex">
                {ENTRY_POINTS.map((item, i) => (
                  <span key={item.label} className="flex items-center gap-6">
                    {i > 0 && <span className="h-1 w-1 rotate-45 bg-gold-soft/60" aria-hidden="true" />}
                    <a href={item.href} className="caps-link">
                      {item.label}
                    </a>
                  </span>
                ))}
              </nav>
            </div>

            {!still && (
              <p className="journey-scroll-cue" aria-hidden="true">
                <span>Scroll to enter the darshan</span>
                <span className="journey-scroll-line" />
              </p>
            )}
          </div>

          {/* ── Act II copy ── */}
          {!still && (
            <div className="journey-beat journey-beat-2">
              <div className="journey-copy">
                <p className="eyebrow mb-5">Kurukshetra · Chapter 2</p>
                <h2 className="hero-title !text-[clamp(2.5rem,5.4vw,4.6rem)]">
                  A single verse
                  <br />
                  <em className="gold-leaf">changes everything.</em>
                </h2>
                <p className="section-lede mt-6 max-w-sm">
                  Between two armies, one conversation turned a warrior&rsquo;s despair into clarity.
                  It still does.
                </p>
              </div>
            </div>
          )}

          {/* ── Act III copy ── */}
          <div className="journey-beat journey-beat-3">
            <p className="eyebrow mb-5">Vishwaroop · Gita 11.7</p>
            <h2 className="hero-title !text-[clamp(2.6rem,6vw,5rem)]">
              The whole universe,
              <br />
              <em className="gold-leaf">in one form.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-display text-lg italic leading-relaxed text-moonlight/80 md:text-xl">
              &ldquo;Behold, Arjuna &mdash; the entire universe, moving and unmoving, gathered here as one.&rdquo;
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#chat" className="btn-leaf px-7 py-3.5">
                Ask Madhav
              </a>
              <a href="#three-paths" className="btn-ghost px-7 py-3.5">
                Choose your path
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
