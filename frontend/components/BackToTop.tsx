'use client'

import { useEffect, useState } from 'react'

/**
 * Floating "back to top" lotus. The home page is one long scroll
 * (Hero → Stats → DailyVerse → Chat → Popular → Chapters → Stories → Subscribe);
 * this gives a quick way back, especially on mobile. Appears after the seeker
 * scrolls past roughly one viewport.
 */
export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-saffron text-navy shadow-lg shadow-saffron/30
                  flex items-center justify-center text-lg transition-all duration-300 hover:bg-saffron-light hover:scale-110
                  ${show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      ↑
    </button>
  )
}
