'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import EngineChakra from './darshan/EngineChakra'
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
  const [scrolled, setScrolled] = useState(false)
  // Only surface the WhatsApp channel when a number is configured — otherwise
  // /whatsapp is inert and the link would dead-end.
  const whatsappEnabled = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)

  useEffect(() => {
    if (!overlay) return
    const onScroll = () => setScrolled(window.scrollY > 90)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overlay])

  // On the cosmic hero (not scrolled, menu closed) the bar is invisible chrome.
  const onDark = overlay && !scrolled && !menuOpen
  // The page is cosmic top to bottom now, so the scrolled state is darker glass
  // rather than a different palette — only the surface changes, never the ink.
  const link = 'text-moonlight/75 hover:text-gold-soft transition-colors'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        onDark
          ? 'bg-transparent border-b border-white/5'
          : 'bg-cosmos-deep/80 backdrop-blur-md border-b border-white/[0.07]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
            className="text-xl font-semibold text-moonlight transition-colors"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Madhav
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-moonlight/75">
          <a href="/#paths" className={link}>Walk a Path</a>
          <a href="/#daily-verse" className={link}>Daily Wisdom</a>
          <a href="/#chapters" className={link}>18 Chapters</a>
          <a href="/#stories" className={link}>Stories</a>
          <a href="/journal" className={link}>Journal</a>
          {whatsappEnabled && <a href="/whatsapp" className={link}>WhatsApp</a>}
        </div>

        {/* CTA */}
        <a
          href="/#chat"
          className="hidden md:inline-block px-4 py-2 bg-saffron text-navy text-sm font-medium rounded-full hover:bg-saffron-light transition-colors"
        >
          Ask Madhav
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-moonlight/80 transition-colors hover:text-gold-soft"
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
        <div className="md:hidden border-t border-white/[0.07] bg-cosmos-deep/95 px-6 py-4 flex flex-col gap-4 text-sm text-moonlight/75">
          <a href="/#paths" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Walk a Path</a>
          <a href="/#daily-verse" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Daily Wisdom</a>
          <a href="/#chapters" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">18 Chapters</a>
          <a href="/#stories" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Stories</a>
          <a href="/journal" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">Journal</a>
          {whatsappEnabled && (
            <a href="/whatsapp" onClick={() => setMenuOpen(false)} className="hover:text-gold-soft transition-colors">WhatsApp</a>
          )}
          <a href="/#chat" onClick={() => setMenuOpen(false)} className="px-4 py-2 bg-saffron text-navy font-medium rounded-full text-center hover:bg-saffron-light transition-colors">Ask Madhav</a>
        </div>
      )}
    </nav>
  )
}
