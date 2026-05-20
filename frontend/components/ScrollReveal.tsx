'use client'

import { useEffect } from 'react'

/**
 * Reveals elements marked with `data-reveal` as they scroll into view by
 * adding the `.in-view` class (styled in globals.css). Mounts once on the page.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'))
    if (els.length === 0) return
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
