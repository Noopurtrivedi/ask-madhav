/**
 * /whatsapp — "Chat with Madhav on WhatsApp" landing page.
 *
 * Renders a QR code that, when scanned, opens a WhatsApp chat with the Business
 * number (a wa.me deep link with a friendly pre-filled greeting). On a phone
 * the QR is awkward, so we also show a tap-to-open button.
 *
 * The number comes from NEXT_PUBLIC_WHATSAPP_NUMBER (E.164 digits, no '+').
 * If it's unset the page shows a gentle "coming soon" state instead of breaking.
 */
import type { Metadata } from 'next'
import QRCode from 'qrcode'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chat with Madhav on WhatsApp',
  description: 'Scan to chat with Madhav, your Sarthi, directly in WhatsApp — guidance grounded in the Bhagavad Gita.',
}

const PREFILL = 'Namaste Madhav 🙏'

export default async function WhatsAppPage() {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')

  if (!number) {
    return (
      <main className="darshan-page min-h-screen flex flex-col items-center justify-center px-6 text-center bg-amber-50">
        <h1 className="text-2xl font-semibold text-amber-900">WhatsApp chat is coming soon</h1>
        <p className="mt-3 max-w-md text-amber-800/80">
          Madhav will soon walk beside you in WhatsApp too. For now, ask him here on the web.
        </p>
        <Link href="/" className="mt-6 underline text-amber-700">
          ← Back to Ask Madhav
        </Link>
      </main>
    )
  }

  const waLink = `https://wa.me/${number}?text=${encodeURIComponent(PREFILL)}`
  const qrSvg = await QRCode.toString(waLink, {
    type: 'svg',
    margin: 1,
    color: { dark: '#7c2d12', light: '#00000000' }, // saffron on transparent
    errorCorrectionLevel: 'M',
  })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center bg-gradient-to-b from-amber-50 to-orange-50">
      <p className="text-sm uppercase tracking-widest text-amber-700/70">Your Sarthi, a message away</p>
      <h1 className="mt-2 text-3xl font-semibold text-amber-900">Chat with Madhav on WhatsApp</h1>
      <p className="mt-3 max-w-md text-amber-800/80">
        Scan the code to open a chat with Madhav and text him as you would a trusted guide.
        He answers through the timeless wisdom of the Bhagavad Gita.
      </p>

      <div
        className="mt-8 w-56 h-56 sm:w-64 sm:h-64 p-4 bg-white/[0.05] rounded-2xl shadow-lg ring-1 ring-amber-200"
        // qrSvg is generated server-side from a trusted env var — safe to inline.
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 font-medium text-white shadow hover:bg-green-700 transition"
      >
        Open WhatsApp chat →
      </a>

      <p className="mt-6 max-w-md text-xs text-amber-700/60">
        Guidance inspired by the Bhagavad Gita — not a substitute for professional medical,
        legal, or financial advice.
      </p>
      <Link href="/" className="mt-4 text-sm underline text-amber-700">
        ← Back to Ask Madhav
      </Link>
    </main>
  )
}
