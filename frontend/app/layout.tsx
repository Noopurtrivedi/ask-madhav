import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ask Madhav — Bhagavad Gita Guidance',
  description: 'Seek wisdom from the Bhagavad Gita for your daily life questions. Grounded in real verses.',
  keywords: ['Bhagavad Gita', 'Krishna', 'wisdom', 'guidance', 'spirituality', 'Hinduism'],
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
