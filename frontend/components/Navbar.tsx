'use client'

import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/90 backdrop-blur-sm border-b border-saffron/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none">🪷</span>
          <span
            className="text-xl font-semibold text-saffron"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Madhav
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-cream/70 text-sm">
          <a href="/#daily-verse" className="hover:text-saffron transition-colors">Daily Verse</a>
          <a href="/#chat" className="hover:text-saffron transition-colors">Ask a Question</a>
          <a href="/#stories" className="hover:text-saffron transition-colors">Stories</a>
          <a href="/journal" className="hover:text-saffron transition-colors">Journal</a>
        </div>

        {/* CTA */}
        <a
          href="/#chat"
          className="hidden md:inline-block px-4 py-2 bg-saffron text-navy text-sm font-medium rounded-full hover:bg-saffron-light transition-colors"
        >
          Ask Now
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cream/70 hover:text-saffron transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
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
        <div className="md:hidden border-t border-saffron/10 bg-navy-dark/95 px-6 py-4 flex flex-col gap-4 text-sm text-cream/70">
          <a href="/#daily-verse" onClick={() => setMenuOpen(false)} className="hover:text-saffron transition-colors">Daily Verse</a>
          <a href="/#chat" onClick={() => setMenuOpen(false)} className="hover:text-saffron transition-colors">Ask a Question</a>
          <a href="/#stories" onClick={() => setMenuOpen(false)} className="hover:text-saffron transition-colors">Stories</a>
          <a href="/journal" onClick={() => setMenuOpen(false)} className="hover:text-saffron transition-colors">Journal</a>
          <a href="/#chat" onClick={() => setMenuOpen(false)} className="px-4 py-2 bg-saffron text-navy font-medium rounded-full text-center hover:bg-saffron-light transition-colors">Ask Now</a>
        </div>
      )}
    </nav>
  )
}
