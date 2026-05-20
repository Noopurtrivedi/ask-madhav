import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
  const supabase = getAdminClient()

  if (email && supabase) {
    await supabase.from('ritual_subscribers').update({ active: false }).eq('email', email)
  }

  // Friendly confirmation page.
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
     <body style="background:#0A0F2E;color:#FFF8E7;font-family:Georgia,serif;text-align:center;padding:80px 20px">
       <div style="font-size:48px">🪷</div>
       <h1 style="color:#E8A620">You're unsubscribed</h1>
       <p style="opacity:0.7">You will no longer receive the Daily Ritual. Peace be with you.</p>
       <a href="/" style="color:#E8A620">Return to Ask Madhav</a>
     </body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
