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
import ThreePaths from '@/components/ThreePaths'
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

const FOOTER_COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: "Today's shloka", href: '/#daily-verse' },
      { label: 'The 18 chapters', href: '/#chapters' },
      { label: 'Popular verses', href: '/#popular' },
      { label: 'Mahabharata stories', href: '/#stories' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { label: 'Ask Madhav', href: '/#chat' },
      { label: 'Walk a path', href: '/#paths' },
      { label: 'Sankalpa Journal', href: '/journal' },
    ],
  },
  {
    title: 'Connect',
    links: [{ label: 'Daily verse by email', href: '/#ritual' }],
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
      <div data-reveal><ThreePaths /></div>

      {/* Pillars — three numbers between hairlines, set like an inscription. */}
      <section className="px-6 py-20" data-reveal>
        <div className="mx-auto max-w-5xl">
          <div className="grid border-y border-gold-soft/15 md:grid-cols-3 md:divide-x md:divide-gold-soft/15">
            {STATS.map((item) => (
              <div key={item.label} className="px-8 py-10 text-center">
                <p className="gold-leaf font-display text-6xl font-semibold leading-none md:text-7xl">
                  {item.number}
                </p>
                <p className="mt-4 font-sans font-bold text-[0.7rem] tracking-[0.3em] text-moonlight/80 uppercase">
                  {item.label}
                </p>
                <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-moonlight/50">{item.desc}</p>
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

      {/* Footer — no background of its own; it sits in the same continuous sky
          as everything above it, separated only by a hairline. */}
      <footer className="border-t border-white/[0.06] px-6 pb-12 pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="font-caps text-lg font-semibold tracking-[0.28em] text-moonlight">ASK MADHAV</p>
              <p className="mt-4 max-w-xs font-display text-xl italic leading-snug text-moonlight/70">
                &ldquo;You have a right to your actions, never to their fruits.&rdquo;
              </p>
              <p className="mt-2 font-sans font-bold text-[0.65rem] tracking-[0.28em] text-gold-soft/70">Bhagavad Gita 2.47</p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="font-sans font-bold text-[0.68rem] tracking-[0.28em] text-gold-soft/80 uppercase">{col.title}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-moonlight/60 transition-colors hover:text-moonlight">
                        {l.label}
                      </a>
                    </li>
                  ))}
                  {col.title === 'Connect' && process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                    <li>
                      <a href="/whatsapp" className="text-moonlight/60 transition-colors hover:text-moonlight">
                        Madhav on WhatsApp
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="ornament-rule my-12" aria-hidden="true">
            <span className="h-1.5 w-1.5 rotate-45 bg-gold-soft/60" />
          </div>

          <div className="grid gap-6 text-xs leading-relaxed md:grid-cols-2">
            <div>
              {/* Gita Press attribution — the credibility line */}
              <p className="text-moonlight/50">
                Sanskrit &amp; Hindi Bhavartha: Swami Ramsukhdas,{' '}
                <span className="italic">Sadhak-Sanjivani</span> (Gita Press, Gorakhpur) · English: Swami
                Gambhirananda · Digitized by IIT Kanpur Gita Supersite
              </p>
              <p className="mt-3 text-moonlight/35">
                This application offers reflections through the lens of the Bhagavad Gita. It is not a
                professional coach, therapist, religious authority, legal, medical, or financial advisor;
                it is an effort to bring shlokas into simple language for daily reflection.
              </p>
            </div>
            {/* Motion control — the OS setting is honoured automatically, but a
                seeker who has never found it can choose stillness right here. */}
            <div className="md:justify-self-end">
              <MotionPreferenceToggle tone="dark" />
            </div>
          </div>

          <p className="mt-10 text-center font-sans font-bold text-[0.62rem] tracking-[0.3em] text-moonlight/30 uppercase">
            Built with reverence for timeless wisdom
          </p>
        </div>
      </footer>

      <BackToTop />
    </main>
  )
}
