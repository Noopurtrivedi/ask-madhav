'use client'

import KrishnaAvatar from './KrishnaAvatar'

export default function Hero() {
  const scrollToChat = () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20"
      style={{ background: 'linear-gradient(180deg, #050A1E 0%, #0A0F2E 50%, #111827 100%)' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #E8A620 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative concentric arcs */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5 pointer-events-none"
        viewBox="0 0 600 600"
      >
        <circle cx="300" cy="300" r="280" fill="none" stroke="#E8A620" strokeWidth="1" />
        <circle cx="300" cy="300" r="220" fill="none" stroke="#E8A620" strokeWidth="0.5" />
        <circle cx="300" cy="300" r="160" fill="none" stroke="#E8A620" strokeWidth="0.5" />
        <circle cx="300" cy="300" r="100" fill="none" stroke="#E8A620" strokeWidth="0.5" />
      </svg>

      <div className="relative z-10 text-center max-w-3xl">
        <KrishnaAvatar />

        <p className="text-saffron/70 text-sm font-medium tracking-[0.3em] uppercase mb-4">
          Bhagavad Gita · 700 Verses · Timeless Wisdom
        </p>

        <h1
          className="text-5xl md:text-7xl font-bold text-cream mb-6 leading-tight"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Seek Wisdom.<br />
          <span className="text-saffron">Find Peace.</span>
        </h1>

        <p className="text-cream/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Bring your daily life questions. Receive guidance rooted in the eternal teachings
          of the Bhagavad Gita — verse by verse, truth by truth.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToChat}
            className="px-8 py-4 bg-saffron text-navy font-semibold rounded-full text-lg
                       hover:bg-saffron-light transition-all hover:scale-105 shadow-lg shadow-saffron/20"
          >
            Ask a Question
          </button>
          <a
            href="#daily-verse"
            className="px-8 py-4 border border-saffron/40 text-cream rounded-full text-lg
                       hover:border-saffron/80 transition-all hover:scale-105 inline-block"
          >
            Today&apos;s Verse
          </a>
        </div>

        <p className="mt-8 text-cream/30 text-xs max-w-lg mx-auto">
          Guidance inspired by the Bhagavad Gita. Not a divine oracle. Not medical, legal, or financial advice.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/30">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cream/30 to-transparent" />
      </div>
    </section>
  )
}
