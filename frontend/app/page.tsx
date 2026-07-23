import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import DailyVerse from '@/components/DailyVerse'
import ChatInterface from '@/components/ChatInterface'
import StoryCards from '@/components/StoryCards'
import PopularVerses from '@/components/PopularVerses'
import ChapterBrowser from '@/components/ChapterBrowser'
import SubscribeRitual from '@/components/SubscribeRitual'
import ScrollReveal from '@/components/ScrollReveal'
import BackToTop from '@/components/BackToTop'
import GuidedPaths from '@/components/GuidedPaths'
import VishwaroopDarshan from '@/components/darshan/VishwaroopDarshan'
import MotionPreferenceToggle from '@/components/darshan/MotionPreferenceToggle'

const STATS = [
  {
    number: '18',
    label: 'Yogas',
    desc: 'Each chapter a complete path — from Karma Yoga to Moksha Sanyasa Yoga',
  },
  {
    number: '700',
    label: 'Verses',
    desc: 'Every shloka a gem of wisdom applicable to daily life',
  },
  {
    number: '5000+',
    label: 'Years of Guidance',
    desc: 'Ancient wisdom that speaks directly to the modern human heart',
  },
]

export default function Home() {
  return (
    <main className="darshan-page">
      <ScrollReveal />
      {/* `overlay` — the home page opens on the dark cosmic Darshan hero, so the
          bar starts transparent and only takes on its cream glass on scroll. */}
      <Navbar overlay />
      <Hero />

      {/* Stats bar */}
      <section className="py-16 px-6"  data-reveal>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {STATS.map((item) => (
              <div key={item.label} className="p-6">
                <p
                  className="text-5xl font-bold text-saffron mb-2"
                  style={{ fontFamily: 'Crimson Text, serif' }}
                >
                  {item.number}
                </p>
                <p className="text-moonlight font-medium mb-2">{item.label}</p>
                <p className="text-moonlight/58 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div data-reveal><DailyVerse /></div>
      <div data-reveal><ChatInterface /></div>
      <div data-reveal><GuidedPaths /></div>
      <div data-reveal><PopularVerses /></div>
      <div data-reveal><ChapterBrowser /></div>
      <div data-reveal><StoryCards /></div>
      <div data-reveal><SubscribeRitual /></div>
      {/* The Cosmic Form: an invitation only — nothing loads until it is accepted.
          It sits last so its gradient runs straight into the dark footer, making
          the page open and close on the same cosmos. */}
      <div data-reveal><VishwaroopDarshan /></div>

      {/* Footer */}
      {/* No background of its own — it sits in the same continuous sky as
          everything above it, separated only by a hairline. */}
      <footer className="border-t border-white/[0.06] px-6 py-14">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-3xl select-none">🪷</span>
          <p className="text-moonlight/70 mt-3 text-sm font-medium">
            Ask Madhav — Bhagavad Gita Guidance
          </p>

          {/* Channels */}
          <div className="flex items-center justify-center gap-5 mt-4 text-sm">
            <a href="/#chat" className="text-gold-soft/80 hover:text-gold-soft transition-colors">Ask a Question</a>
            <a href="/journal" className="text-gold-soft/80 hover:text-gold-soft transition-colors">Journal</a>
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
              <a href="/whatsapp" className="text-gold-soft/80 hover:text-gold-soft transition-colors">WhatsApp</a>
            )}
          </div>

          {/* Motion control — the OS setting is honoured automatically, but a
              seeker who has never found it can choose stillness right here. */}
          <MotionPreferenceToggle tone="dark" className="mt-8 border-t border-white/10 pt-6" />

          {/* Gita Press attribution — the credibility line */}
          <p className="text-moonlight/55 text-xs mt-3 font-medium">
            Sanskrit & Hindi Bhavartha: Swami Ramsukhdas,{' '}
            <span className="italic">Sadhak-Sanjivani</span>
            {' '}(Gita Press, Gorakhpur) · English: Swami Gambhirananda
            {' '}· Digitized by IIT Kanpur Gita Supersite
          </p>

          <p className="text-moonlight/35 text-xs mt-4 max-w-lg mx-auto leading-relaxed">
            This application provides spiritual guidance inspired by the Bhagavad Gita.
            It is not a religious authority, does not represent the divine Krishna,
            and is not a substitute for medical, legal, or financial advice.
          </p>
          <p className="text-moonlight/25 text-xs mt-6">
            Built with reverence for timeless wisdom
          </p>
        </div>
      </footer>

      <BackToTop />
    </main>
  )
}
