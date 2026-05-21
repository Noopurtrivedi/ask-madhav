# Deferred changes — 2026-05-21

During the dataset-cleanup + go-live work, a separate in-progress feature was
present as **uncommitted working-tree changes**. It was intentionally **not**
shipped to production (we deployed only the clean 701-verse dataset + RAG/retrieval
fixes). The feature was archived here and then discarded from the working tree so
the repo and production stayed clean.

To restore it for review later:

```bash
git apply docs/deferred-confidence-feature.patch
```

## What the deferred feature does — "retrieval confidence + accountability"

A cohesive enhancement spanning four files (see the patch for exact diffs):

| File | Change |
|---|---|
| `frontend/lib/verseEngine.ts` | *(already committed)* `retrieve()` returns `{ verses, matched, topScore, confidence }` and a `RetrievalConfidence` type. This part shipped because my reference-retrieval work is interleaved in the same file. |
| `frontend/app/api/ask/route.ts` | Switches `scoreVerses` → `retrieve()`, threads `confidence` into `generateGuidance(...)`, and returns `matched` + `confidence` in the JSON response. |
| `frontend/components/ChatInterface.tsx` | Renders a "why this verse" row — a confidence dot (high/medium/low) plus matched-term chips — above the verse cards. |
| `frontend/types/index.ts` | Adds `matched?: string[]` and `confidence?: RetrievalConfidence` to `AskResponse` / `ChatMessage`. |
| `frontend/supabase/schema.sql` | Adds `acted_on_intention boolean` to `journal_entries` (+ idempotent backfill) for a daily-ritual one-tap "did you act on yesterday's Sankalpa?" check-in. |

### Status / why deferred
- The shipped `gemini.ts` already accepts an optional `confidence` arg (defaults to `'high'`), and the shipped `verseEngine.ts` already exports `retrieve()`/`RetrievalConfidence` — so re-applying the patch is low-friction and should not conflict.
- It was deferred because it was unreviewed in-progress work from a parallel session, and the goal was to ship *only* the verified clean-dataset fix.

### Note on `verses_700.json`
The raw scrape (`verses_700.json`) was modified pre-session; it is the **input** to
`build_verses.py` that produced the committed clean `frontend/data/verses.json`. It
was **committed** (not discarded) so the dataset stays reproducible. Do **not** copy
it directly into the app — see `CLAUDE.md` "Verse data".
