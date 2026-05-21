'use client'

import Image from 'next/image'
import HeroVerse from './HeroVerse'
import { SunRays, FloatingPetals } from './SacredArt'

export default function Hero() {
  const scrollToChat = () => {
    document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-24 pb-16"
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
      <SunRays className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] opacity-50 pointer-events-none spin-slow" />

      {/* Drifting lotus petals */}
      <FloatingPetals />

      <div className="relative z-10 text-center max-w-3xl fade-up">
        <p className="text-saffron/80 text-sm font-medium tracking-[0.3em] uppercase mb-4">
          Bhagavad Gita · 700 Verses · Timeless Wisdom
        </p>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-ink mb-6 leading-tight"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          Seek Wisdom.<br />
          <span className="shimmer-text">Find Peace.</span>
        </h1>

        {/* The moment of the Gita — Krishna (Madhav) guiding Arjuna at Kurukshetra */}
        <div className="relative mx-auto mb-8 max-w-2xl group">
          {/* Breathing golden aura behind the frame */}
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-saffron/30 via-gold/20 to-saffron/30 blur-2xl lotus-pulse pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden border border-saffron/30 shadow-2xl shadow-saffron/20
                          transition-transform duration-700 ease-out group-hover:scale-[1.02]">
            <Image
              src="/art/scene-2.png"
              alt="Krishna, as the charioteer Madhav, delivers the Bhagavad Gita to the warrior Arjuna on the battlefield of Kurukshetra at dawn"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 768px) 100vw, 672px"
              className="w-full h-auto"
            />
            {/* Soft gold vignette to blend the image into the page */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl bg-gradient-to-t from-black/15 via-transparent to-transparent" />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl" />
          </div>
        </div>

        <p className="text-ink/70 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
          Bring your daily life questions. Receive guidance rooted in the eternal teachings
          of the Bhagavad Gita — verse by verse, truth by truth.
        </p>

        {/* Rotating shloka — opens with "Yada yada hi dharmasya" */}
        <div className="mb-10">
          <HeroVerse />
        </div>

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
          Guidance inspired by the Bhagavad Gita — for reflection, not a substitute for medical,
          legal, or financial advice.
        </p>
      </div>
    </section>
  )
}
