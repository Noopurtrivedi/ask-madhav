# WhatsApp Channel — Setup & Requirements

Chat with **Madhav** directly in WhatsApp. A seeker scans a QR code (or taps a
`wa.me` link), which opens a WhatsApp chat with the Madhav Business number. Every
message they send runs through the **same guidance pipeline as the web chat**
(`lib/guidance.ts` → verse retrieval + Gemini), and Madhav replies in WhatsApp —
acting as their personal Sarthi.

> **What the QR code actually does:** WhatsApp does not let you "install" an app
> into a chat. The QR / `wa.me` link simply opens a 1:1 chat with a WhatsApp
> **Business phone number** you own. Incoming messages hit the webhook below; we
> reply via Meta's send-message API. That produces the "texting Madhav" feel.

---

## Architecture

```
WhatsApp user
   │  (scans QR → opens chat with Business number)
   ▼
Meta WhatsApp Cloud API ──webhook POST──▶  /api/whatsapp  (Next.js, Vercel)
   ▲                                          │
   │                                          ├─ verify signature (X-Hub-Signature-256)
   │                                          ├─ dedup message id        (Upstash Redis)
   │                                          ├─ load conversation memory (Upstash Redis)
   │                                          ├─ answerQuestion()  ← SAME pipeline as /api/ask
   │                                          │     • verseEngine retrieval (always succeeds)
   │                                          │     • Gemini overlay (falls back to template)
   └────────reply (Graph API)─────────────────┘     • send reply + grounding verse
```

### Files added/changed
| File | Role |
|---|---|
| `frontend/lib/guidance.ts` | **New shared pipeline** — `answerQuestion()`. Now used by both `/api/ask` and the WhatsApp webhook so the two channels never drift. |
| `frontend/app/api/ask/route.ts` | Refactored to call `answerQuestion()` (behavior unchanged). |
| `frontend/app/api/whatsapp/route.ts` | **Webhook** — GET verification + POST message handling. `runtime=nodejs`. |
| `frontend/lib/whatsapp/client.ts` | Meta Cloud API send-message client + message chunking + signature verification. |
| `frontend/lib/whatsapp/memory.ts` | Per-phone conversation memory + message-id dedup, backed by Upstash Redis (fail-open). |
| `frontend/app/whatsapp/page.tsx` | `/whatsapp` — QR code + "Open WhatsApp chat" button. |

### Design choices (consistent with the app)
- **Fail-open everywhere.** No env vars → channel inert. Redis down → runs
  stateless. Gemini fails → deterministic template reply. The webhook always
  returns `200` so Meta does not spam retries.
- **Idempotency.** Each WhatsApp message id is recorded in Redis; re-delivered
  webhooks are ignored so Madhav never replies twice.
- **Rate limiting.** Reuses `checkRateLimit`, keyed per phone number (`wa:<num>`).
- **Memory store = Upstash Redis (now).** Last 12 turns per number, 24h TTL.
  **➡️ Roadmap: migrate to Supabase Postgres when traffic grows** for durable,
  queryable conversation history (we already use Supabase for the journal). This
  is intentionally deferred — see `lib/whatsapp/memory.ts` header comment.
- **Language.** Defaults to English; a seeker can type `english` / `hindi` /
  `hinglish` anytime to switch. Devanagari input is auto-answered in Hindi.
- **Verse delivery.** WhatsApp has no `VerseCard` UI, so the grounding verse is
  sent as a clean follow-up message (reference + Sanskrit + transliteration +
  meaning in the seeker's language).

---

## Environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (and
`frontend/.env.local` for local testing). None are committed.

| Variable | Required | Purpose |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | ✅ | Graph API token for your WhatsApp app (use a **permanent System User token** for production; the dashboard token expires in 24h). |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | The **Phone number ID** (not the phone number) from the WhatsApp → API Setup screen. |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Any random string you invent; you paste the same value into Meta's webhook config. |
| `WHATSAPP_APP_SECRET` | Recommended | Your Meta **App Secret**. Enables `X-Hub-Signature-256` verification so only Meta can call the webhook. If unset, verification is skipped (fine for first test, set it before going live). |
| `WHATSAPP_GRAPH_VERSION` | optional | Graph API version, default `v21.0`. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | for QR page | Your Business number in E.164 digits, **no `+`** (e.g. `919876543210`). Powers the `/whatsapp` QR + `wa.me` link. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | for memory | Already used by rate limiting. Without them, the WhatsApp chat works but is stateless (no conversation memory) and dedup is per-instance only. |
| `GEMINI_API_KEY` | for AI replies | Same key as the web chat. Without it, WhatsApp replies use the template engine. |

---

## One-time setup (Meta WhatsApp Cloud API)

1. **Create a Meta app**: <https://developers.facebook.com> → *My Apps* →
   *Create App* → type **Business** → add the **WhatsApp** product.
2. **Get a test number & token**: In *WhatsApp → API Setup*, Meta gives you a
   free **test sender number** and a temporary `WHATSAPP_ACCESS_TOKEN`. Copy the
   **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`. Add your own phone as a test
   recipient to try it immediately.
3. **Set env vars** in Vercel (table above) and redeploy so `/api/whatsapp` is live
   at `https://<your-domain>/api/whatsapp`.
4. **Configure the webhook**: *WhatsApp → Configuration → Edit*:
   - **Callback URL**: `https://<your-domain>/api/whatsapp`
   - **Verify token**: the exact `WHATSAPP_VERIFY_TOKEN` you set.
   - Click **Verify and Save** (this fires the GET handshake — our route echoes
     `hub.challenge`).
   - Under **Webhook fields**, **Subscribe** to `messages`.
5. **App Secret** (recommended): *App Settings → Basic → App Secret* →
   `WHATSAPP_APP_SECRET`. Redeploy.
6. **Test**: from the test recipient phone, message your Business number. You
   should get the welcome, then real guidance.

### Going to production
- Add a real phone number in *WhatsApp → API Setup* (it must **not** be active on
  the consumer WhatsApp app), complete **Business Verification**, and generate a
  **permanent System User access token** (Business Settings → Users → System
  Users) — the 24h dashboard token is for testing only.
- Meta requires an approved **message template** to *start* a conversation, but
  replying within the 24-hour customer-service window (which is exactly our
  use case — the seeker messages first) needs **no template**.

---

## Try the QR page

Once `NEXT_PUBLIC_WHATSAPP_NUMBER` is set, visit `https://<your-domain>/whatsapp`
to see the scannable QR + "Open WhatsApp chat" button. Link it from the Hero /
navbar when you're ready to promote it (not wired into the home page yet — say
the word and I'll add a CTA).

---

## Known limitations / future work
- **Inline processing.** Gemini runs inside the webhook request. With
  `thinkingBudget: 0` it's fast, and dedup prevents double-replies, but at scale
  move generation to a background task (`waitUntil` / a queue) and 200 instantly.
- **Memory store** → Supabase migration when traffic grows (noted above).
- **Voice notes / images** are ignored (text only). Could transcribe audio via
  Gemini later.
- **Age-band tuning** isn't collected over WhatsApp (web chat only); replies use
  the default (untuned) analogy world. Could add an onboarding question.
