import type { Metadata, Viewport } from 'next'
import AuthProvider from '@/components/auth/AuthProvider'
import DarshanProvider from '@/components/darshan/DarshanProvider'
import CosmicJourney from '@/components/darshan/CosmicJourney'
import DarshanDebugPanel from '@/components/darshan/DarshanDebugPanel'
import { Cinzel, Cormorant_Garamond, Manrope, Tiro_Devanagari_Sanskrit, Noto_Serif_Devanagari } from 'next/font/google'
import './globals.css'

// The type system — all free Google fonts, self-hosted by next/font so nothing
// is fetched from Google at runtime and there is no layout shift.
//  · Cinzel — inscriptional capitals (wordmark, eyebrows): temple stone.
//  · Cormorant Garamond — the editorial display serif for every heading.
//  · Manrope — the quiet, modern sans for reading and UI.
//  · Tiro Devanagari Sanskrit — the shloka itself; Noto Serif for Hindi prose.
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-caps', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})
const manrope = Manrope({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sans', display: 'swap' })
const tiro = Tiro_Devanagari_Sanskrit({ subsets: ['devanagari', 'latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-sanskrit', display: 'swap' })
const notoDeva = Noto_Serif_Devanagari({ subsets: ['devanagari'], weight: ['400', '500'], variable: '--font-hindi', display: 'swap' })
const fontVars = [cinzel, cormorant, manrope, tiro, notoDeva].map((f) => f.variable).join(' ')

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Ask Madhav — Bhagavad Gita Guidance',
  description: 'Seek wisdom from the Bhagavad Gita for your daily life questions. Grounded in real verses.',
  keywords: ['Bhagavad Gita', 'Krishna', 'wisdom', 'guidance', 'spirituality', 'Hinduism'],
  openGraph: {
    title: 'Ask Madhav — Bhagavad Gita Guidance',
    description: 'Bring your daily life questions. Receive guidance rooted in the eternal teachings of the Bhagavad Gita.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ask Madhav — Bhagavad Gita Guidance',
    description: 'Wisdom from the Bhagavad Gita for your daily life questions.',
    images: ['/api/og'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // `suppressHydrationWarning`: the Darshan launch script mutates the veil
    // before hydration (so a returning seeker never sees it flash), and browser
    // extensions commonly stamp attributes on <html>. Neither is server-visible.
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <body>
        {/*
          The Darshan Experience Engine wraps the whole app so state, device
          tier and the active quote are shared by every route — the navbar
          chakra reacts to a question asked three sections down the page.
          It renders no markup of its own and, with no CMS configured, resolves
          to DEFAULT_DARSHAN_CONFIG. See docs/DARSHAN.md.

          TODO(cms): fetch `darshan_config` + `avatar_forms` in a Server
          Component here and pass them as `config={…}`.
        */}
        <DarshanProvider>
          {/* One sky behind every route — fixed, scroll-driven, and the only
              background the site has. See components/darshan/CosmicJourney.tsx. */}
          <CosmicJourney />
          {/* Session context for every route. The app itself stays open —
              only account-bound features (the Journal) wrap themselves in
              <AuthGate>. Fail-open without Supabase env vars. */}
          <AuthProvider>{children}</AuthProvider>
          <DarshanDebugPanel />
        </DarshanProvider>
      </body>
    </html>
  )
}
