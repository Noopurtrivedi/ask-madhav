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

// The opening frame: an original Shree Krishna avatar (FLUX.1 [schnell],
// Apache-2.0, generated locally — see docs/AVATAR.md). (fx, fy) is the centre
// of the Sudarshan Chakra as fractions of the image: on his index finger, a
// little below the tip, so the fingertip rises through the disc's hole.
// `x`/`mobileX` place that point on screen.
const ART = {
  src: '/art/krishna-avatar.jpg',
  w: 2560,
  h: 1440,
  fx: 0.5242,
  fy: 0.3444,
  x: 0.58,
  mobileX: 0.36,
}

// The fingertip above the disc's centre line, cut out of the same image
// (public/art/krishna-fingertip.png, image px). It is layered *over* the
// flat-lying chakra so the finger reads as passing through the hole: the
// disc's far half sits behind it, the near half covers the rest of the finger.
const TIP = { src: '/art/krishna-fingertip.png', x: 1300, y: 440, w: 86, h: 56 }

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
 *       chakra lifts off his fingertip, turns to face the seeker, grows and races —
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
  const starCount = engine?.tier === 'lite' ? 1600 : 3200

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const galaxy = useRef<GalaxyDrive>({ burst: 0, active: false })
  const [diving, setDiving] = useState(false)

  // ── Frame the painting so the fingertip lands where the composition wants it
  //    (right of centre on desktop, upper-centre on a phone), and tell the stage
  //    where that is so the zoom origin and the chakra sit on it exactly.
  useEffect(() => {
    const stage = stageRef.current
    const art = artRef.current
    const tip = tipRef.current
    if (!stage || !art || !tip) return
    const layout = () => {
      const W = stage.clientWidth
      const H = stage.clientHeight
      // Cover the frame. The avatar is composed with open ivory mist on the
      // left for the headline, so desktop keeps him right of centre and a
      // phone slides the frame so his face and the fingertip both stay in.
      const s = Math.max(W / ART.w, H / ART.h)
      const dw = ART.w * s
      const dh = ART.h * s
      const wantX = W >= 1024 ? ART.x : ART.mobileX
      const left = Math.min(0, Math.max(W - dw, W * wantX - ART.fx * dw))
      const top = Math.min(0, Math.max(H - dh, H * 0.27 - ART.fy * dh))
      const rect = { left: `${left}px`, top: `${top}px`, width: `${dw}px`, height: `${dh}px` }
      Object.assign(art.style, rect)
      Object.assign(tip.style, rect)
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
      // ── The take-off, choreographed like the logo's launch ritual ──
      // Gather: the disc brightens on his fingertip and two rings of light
      // ripple out in its plane. Throw: it lifts off and flies an arc — up,
      // then out at the seeker to the centre of the frame — opening from flat
      // to face-on with two tumbles. Everything is a function of scroll, so
      // scrolling back flies it home and lands it flat on the fingertip.
      const W = window.innerWidth
      const H = window.innerHeight
      const fx = parseFloat(stage.style.getPropertyValue('--fx')) || W * 0.58
      const fy = parseFloat(stage.style.getPropertyValue('--fy')) || H * 0.3
      set('--gather', smooth(0.04, 0.12, p) * (1 - smooth(0.3, 0.45, p)))
      set('--ring1', smooth(0.05, 0.13, p))
      set('--ring2', smooth(0.08, 0.16, p))
      const u = smooth(0.12, 0.4, p)
      const endX = W / 2 - fx
      const endY = H / 2 - fy
      const c1x = endX * 0.15 - W * 0.05
      const c1y = -H * 0.34
      const cx = 2 * (1 - u) * u * c1x + u * u * endX
      const cy = 2 * (1 - u) * u * c1y + u * u * endY
      set('--cx', cx)
      set('--cy', cy)
      stage.style.setProperty('--chx', `${(fx + cx).toFixed(1)}px`)
      stage.style.setProperty('--chy', `${(fy + cy).toFixed(1)}px`)
      set('--tilt', 70 * (1 - smooth(0.12, 0.36, p)))
      set('--tumble', Math.sin(u * Math.PI * 4) * 26 * (1 - u))
      // The cut-out fingertip exists only while the disc sits on it.
      set('--tip', 1 - smooth(0.115, 0.13, p))
      set('--art', 1 - smooth(0.46, 0.53, p))
      // A phone frames him smaller, so the disc starts a little smaller too.
      const base = window.innerWidth >= 1024 ? 0.34 : 0.27
      set('--cs', base + 4.4 * t * t * t)
      set('--ca', 1 - smooth(0.5, 0.535, p))
      // A true whiteout: the light builds, holds fully opaque while the
      // painting and chakra are swapped for the galaxy, then fades to reveal it.
      set('--flash', smooth(0.45, 0.52, p) * (1 - smooth(0.56, 0.66, p)))
      set('--b1', 1 - smooth(0.04, 0.14, p))
      set('--b2', smooth(0.17, 0.24, p) * (1 - smooth(0.38, 0.45, p)))
      set('--b3', smooth(0.7, 0.8, p))
      // The galaxy is placed only behind the fully opaque light (0.52–0.56),
      // so the cut between the two worlds is never seen.
      set('--gal', smooth(0.525, 0.545, p))
      stage.dataset.act = p < 0.12 ? '1' : p > 0.68 ? '3' : '2'
      // While the film fills the screen, the site-wide sky behind it is
      // invisible — stop painting it (measured: ~30% of frame time).
      const covers = rect.top <= 1 && rect.bottom >= window.innerHeight - 1
      document.documentElement.toggleAttribute('data-hero-covers', covers)

      const burst = smooth(0.545, 0.78, p)
      galaxy.current.burst = 1 - Math.pow(1 - burst, 3)
      galaxy.current.active = inView && p > 0.52

      // Throw speed from the gather until the whiteout; below it the engine
      // eases the spin back down — the landing decelerates like a discus.
      const nowDiving = p > 0.08 && p < 0.6
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
      document.documentElement.removeAttribute('data-hero-covers')
    }
  }, [still])

  return (
    <>
      <ChakraLaunch />

      <section id="darshan" ref={sectionRef} className={`journey ${still ? 'journey-still' : ''}`}>
        <div ref={stageRef} className="journey-stage journey-light" data-act="1">
          {/* ── Act I/II: the painting, zooming toward the fingertip ── */}
          <div className="journey-art-zoom" aria-hidden="true">
            <div ref={artRef} className="absolute">
              <Image src={ART.src} alt="" fill priority sizes="(min-width: 1024px) 100vw, 260vw" className="object-cover" />
            </div>
          </div>
          <div className="journey-shade" aria-hidden="true" />

          {/* The Sudarshan Chakra, lying flat and spinning on Krishna's
              fingertip — the door we dive through. */}
          {/* Rings of light the chakra gathers before the throw (in its plane). */}
          <div className="journey-ring journey-ring-1" aria-hidden="true" />
          <div className="journey-ring journey-ring-2" aria-hidden="true" />
          <div className="journey-chakra" aria-hidden="true">
            <div className="journey-chakra-glow" />
            <EngineChakra size={600} override={diving ? 'processing' : undefined} />
          </div>

          {/* The fingertip through the disc's hole (see TIP). Zooms with the art. */}
          <div className="journey-tip" aria-hidden="true">
            <div ref={tipRef} className="absolute">
              <span
                className="absolute"
                style={{
                  left: `${(TIP.x / ART.w) * 100}%`,
                  top: `${(TIP.y / ART.h) * 100}%`,
                  width: `${(TIP.w / ART.w) * 100}%`,
                  height: `${(TIP.h / ART.h) * 100}%`,
                }}
              >
                <Image src={TIP.src} alt="" fill unoptimized sizes="120px" />
              </span>
            </div>
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
              <p className="journey-lede mb-8 max-w-[33rem] text-base leading-[1.8] text-moonlight/80 md:text-[1.075rem]">
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
                    className="journey-chip rounded-full border border-white/15 bg-black/25 px-3.5 py-1.5 text-xs text-moonlight/75 transition-colors hover:border-gold-soft/60 hover:text-moonlight"
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
                <a href="#daily-verse" className="btn-leaf mt-8 px-6 py-3">
                  Read today&rsquo;s verse <span aria-hidden="true">→</span>
                </a>
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
