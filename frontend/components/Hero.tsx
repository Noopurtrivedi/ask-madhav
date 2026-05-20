'use client'

import KrishnaAvatar from './KrishnaAvatar'
import { SunRays, PeacockFeather, FloatingPetals } from './SacredArt'

export default function Hero() {
  const scrollToChat = () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20"
      style={{ background: 'linear-gradient(180deg, #FBEFD6 0%, #FFFCF5 55%, #FBF4E6 100%)' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #E8A620 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radiant sun behind everything */}
      <SunRays className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] w-[760px] h-[760px] opacity-60 pointer-events-none spin-slow" />

      {/* Peacock feathers framing the hero (hidden on small screens) */}
      <PeacockFeather className="hidden lg:block absolute left-[7%] top-1/2 -translate-y-1/2 w-28 h-72 opacity-80 float-y" />
      <PeacockFeather className="hidden lg:block absolute right-[7%] top-1/2 -translate-y-1/2 w-28 h-72 opacity-80 float-y -scale-x-100" />

      {/* Drifting lotus petals */}
      <FloatingPetals />

      <div className="relative z-10 text-center max-w-3xl fade-up">
        <KrishnaAvatar />

        <p className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase mb-4">
          Bhagavad Gita · 700 Verses · Timeless Wisdom
        </p>

        <h1
          className="text-5xl md:text-7xl font-bold text-ink mb-6 leading-tight"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Seek Wisdom.<br />
          <span className="shimmer-text">Find Peace.</span>
        </h1>

        <p className="text-ink/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Bring your daily life questions. Receive guidance rooted in the eternal teachings
          of the Bhagavad Gita — verse by verse, truth by truth.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToChat}
            className="px-8 py-4 bg-saffron text-navy font-semibold rounded-full text-lg
                       hover:bg-saffron-light transition-all hover:scale-105 shadow-lg shadow-saffron/30"
          >
            Ask a Question
          </button>
          <a
            href="#daily-verse"
            className="px-8 py-4 border border-saffron/50 text-ink rounded-full text-lg bg-white/60
                       hover:border-saffron hover:bg-white transition-all hover:scale-105 inline-block"
          >
            Today&apos;s Verse
          </a>
        </div>

        <p className="mt-8 text-ink/40 text-xs max-w-lg mx-auto">
          Guidance inspired by the Bhagavad Gita. Not a divine oracle. Not medical, legal, or financial advice.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink/40">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-ink/40 to-transparent" />
      </div>
    </section>
  )
}
