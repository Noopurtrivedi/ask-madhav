import type { Metadata, Viewport } from 'next'
import DarshanProvider from '@/components/darshan/DarshanProvider'
import DarshanDebugPanel from '@/components/darshan/DarshanDebugPanel'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning>
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
          {children}
          <DarshanDebugPanel />
        </DarshanProvider>
      </body>
    </html>
  )
}
