'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import EngineChakra from './darshan/EngineChakra'
import { useAuth } from '@/components/auth/AuthProvider'
import { CHAKRA_LOGO_ATTR, replayDarshanLaunch } from '@/lib/darshan-launch'

interface Props {
  /**
   * The page opens with the dark cosmic Darshan hero, so the bar starts
   * transparent with moonlight text and only takes on its cream glass once the
   * seeker scrolls past the hero's first fold.
   */
  overlay?: boolean
}

export default function Navbar({ overlay = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { configured, user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  // Only surface the WhatsApp channel when a number is configured — otherwise
  // /whatsapp is inert and the link would dead-end.
  const whatsappEnabled = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)

  useEffect(() => {
    if (!overlay) return
    // Stay transparent for as long as the film is on ivory (Hero's dive fills
    // the frame at about 38% of the pin); elsewhere, the first 90px.
    const onScroll = () => {
      const film = document.getElementById('darshan')
      const ivory = film ? (film.offsetHeight - window.innerHeight) * 0.38 : 0
      setScrolled(window.scrollY > Math.max(90, ivory))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overlay])

  // Reading progress — a gold line along the bar's lower edge. Written straight
  // to the element's transform: it changes every scroll frame and must never
  // cause a React render.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // On the cosmic hero (not scrolled, menu closed) the bar is invisible chrome.
  // Over the home film's ivory first frame the bar is transparent with dark
  // ink (`nav-on-light`); once the dive leaves the ivory it becomes a solid obsidian
  // bar with moonlight ink — the Beyond pattern.
  const onHero = overlay && !scrolled && !menuOpen
  const link = 'caps-link'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        onHero
          ? 'nav-on-light bg-transparent border-b border-black/5'
          : 'bg-[#07080F]/95 border-b border-gold-soft/10'
      }`}
    >
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-6 py-[1.1rem] flex items-center justify-between">
        {/* Logo — the Sudarshan Chakra lands here at the end of the launch ritual.
            The chakra is its own control rather than part of the home link:
            clicking it releases the discus again, so it must not also navigate. */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={replayDarshanLaunch}
            aria-label="Release the Sudarshan Chakra"
            title="Release the Sudarshan Chakra"
            className="inline-flex rounded-full transition-transform hover:scale-110 active:scale-95
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4
                       focus-visible:outline-gold-soft"
          >
            <span {...{ [CHAKRA_LOGO_ATTR]: '' }} className="inline-flex">
              {/* Engine-bound: turns while Madhav is thinking, settles when the
                  answer begins — the brand mark doubles as the AI status light. */}
              <EngineChakra size={30} />
            </span>
          </button>
          <Link
            href="/"
            className="nav-wordmark font-caps text-[1rem] font-semibold tracking-[0.26em] text-moonlight transition-colors hover:text-gold-soft"
          >
            ASK MADHAV
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          <a href="/#paths" className={link}>Paths</a>
          <a href="/#daily-verse" className={link}>Daily Wisdom</a>
          <a href="/#chapters" className={link}>Chapters</a>
          <a href="/#stories" className={link}>Stories</a>
          <a href="/journal" className={link}>Journal</a>
          {whatsappEnabled && <a href="/whatsapp" className={link}>WhatsApp</a>}
        </div>

        {/* CTA */}
        <a
          href="/#chat"
          className="btn-outline-gold hidden md:inline-flex px-5 py-2.5"
        >
          Ask Madhav <span aria-hidden="true">→</span>
        </a>
        {configured && user && (
          <button
            type="button"
            onClick={signOut}
            title={user.email || undefined}
            className="hidden md:inline-block ml-3 text-xs text-moonlight/45 hover:text-moonlight/75 transition-colors"
          >
            Sign out
          </button>
        )}

        {/* Mobile hamburger */}
        <button
          className="nav-burger md:hidden text-moonlight/80 transition-colors hover:text-gold-soft"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.07] bg-cosmos-deep/95 backdrop-blur-md px-6 py-6 flex flex-col gap-5 text-[0.95rem] text-moonlight/80">
          <a href="/#paths" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Walk a Path</a>
          <a href="/#daily-verse" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Daily Wisdom</a>
          <a href="/#chapters" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">18 Chapters</a>
          <a href="/#stories" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Stories</a>
          <a href="/journal" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Journal</a>
          {whatsappEnabled && (
            <a href="/whatsapp" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">WhatsApp</a>
          )}
          <a href="/#chat" onClick={() => setMenuOpen(false)} className="btn-leaf px-4 py-3 text-sm">Ask Madhav</a>
          {configured && user && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                signOut()
              }}
              className="text-left text-moonlight/45 hover:text-moonlight/75 transition-colors"
            >
              Sign out{user.email ? ` (${user.email})` : ''}
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
