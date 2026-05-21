import type { Metadata, Viewport } from 'next'
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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
