#!/usr/bin/env python3
"""
generate_verses.py
──────────────────
Fetches all 700 Bhagavad Gita verses from IIT Kanpur's Gita Supersite
(gitasupersite.iitk.ac.in), which digitized:

  • Sanskrit shloka    — original Devanagari text
  • Hindi Bhavartha    — Swami Ramsukhdas (Gita Press, Gorakhpur, 1985)
  • English meaning    — Swami Gambhirananda (Advaita Ashrama, 1995)

HOW TO RUN (one-time, on your laptop):
──────────────────────────────────────
  pip install requests beautifulsoup4
  python3 generate_verses.py

Output: verses_700.json
  → Copy to  data/verses.json  in your repo
  → git add data/verses.json && git commit -m "feat: all 700 verses (Gita Press / IIT Kanpur)"
  → git push  — Railway redeploys and seeds all 700 verses automatically

Cost: $0.  No API key.  No LLM calls.  ~15-20 minutes to run once.

Attribution (add to your app footer):
  "Sanskrit & Hindi: Swami Ramsukhdas, Sadhak-Sanjivani
   (Gita Press, Gorakhpur, 1985). Digitized by IIT Kanpur Gita Supersite.
   English: Swami Gambhirananda (Advaita Ashrama, 1995)."
"""

import json
import re
import time
import sys
from collections import defaultdict

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit(
        "\nMissing dependencies. Please run:\n"
        "  pip install requests beautifulsoup4\n"
        "then try again.\n"
    )

# ── IIT Kanpur Gita Supersite ────────────────────────────────────────────────
BASE_URL = "https://www.gitasupersite.iitk.ac.in/srimad"

# URL parameters:
#   scsh=1    → Sanskrit shloka
#   htrskd=1  → Hindi: Swami Ramsukhdas (Gita Press)
#   etgb=1    → English: Swami Gambhirananda

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Referer": "https://www.gitasupersite.iitk.ac.in/",
})

# ── Verse counts per chapter (18 chapters, 700 verses total) ─────────────────
CHAPTER_VERSE_COUNTS = {
    1: 47, 2: 72, 3: 43, 4: 42,  5: 29,
    6: 47, 7: 30, 8: 28, 9: 34, 10: 42,
   11: 55,12: 20,13: 35,14: 27, 15: 20,
   16: 24,17: 28,18: 78,
}

# ── Theme detection ───────────────────────────────────────────────────────────
THEME_SIGNALS = {
    'anger':       ['wrath', 'anger', 'hate', 'enemy', 'fury', 'rage', 'irritat', 'annoy'],
    'grief':       ['grief', 'sorrow', 'lament', 'mourn', 'pain', 'weep', 'afflict', 'suffer', 'distress'],
    'anxiety':     ['fear', 'afraid', 'tremble', 'anxious', 'worry', 'panic', 'dread', 'frightened'],
    'duty':        ['duty', 'dharma', 'righteous', 'prescribed', 'perform', 'obligat', 'role'],
    'detachment':  ['fruit', 'result', 'attachment', 'renounce', 'unattached', 'desire', 'expectation'],
    'courage':     ['brave', 'warrior', 'battle', 'fight', 'strength', 'victory', 'conquer', 'resist'],
    'purpose':     ['purpose', 'meaning', 'goal', 'direction', 'calling', 'mission', 'path'],
    'mind':        ['mind', 'thought', 'intellect', 'concentrat', 'meditat', 'restless', 'distract'],
    'soul':        ['soul', 'spirit', 'eternal', 'immortal', 'body', 'atma', 'self', 'indestructible', 'unborn'],
    'devotion':    ['devotion', 'faith', 'worship', 'love', 'divine', 'surrender', 'bhakti', 'lord', 'krishna'],
    'wisdom':      ['knowledge', 'wisdom', 'understand', 'realize', 'truth', 'enlighten', 'discern'],
    'equanimity':  ['equal', 'balance', 'steady', 'calm', 'peace', 'serene', 'undisturb', 'equanim'],
    'karma yoga':  ['action', 'perform', 'karma', 'selfless', 'deed', 'act', 'work'],
    'surrender':   ['refuge', 'shelter', 'seek', 'grace', 'protect', 'depend'],
    'jealousy':    ['envy', 'rival', 'comparison', 'covet'],
    'addiction':   ['sense', 'pleasure', 'craving', 'desire', 'indulge', 'temptation', 'passion'],
    'guilt':       ['sin', 'wrong', 'evil', 'shame', 'regret', 'transgress', 'impure', 'wicked'],
}

PRACTICAL_GUIDANCE = {
    'anger': (
        "When anger rises, pause before reacting. Ask: 'Is this response aligned with who I want to be?' "
        "Channel that energy into purposeful action rather than reaction."
    ),
    'grief': (
        "Grief is valid and natural. Honor your feelings fully. Then, when ready, remember that the soul "
        "is eternal — what was truly real can never be lost."
    ),
    'anxiety': (
        "Notice where your attention is — on outcomes you cannot control? Gently bring it back to this "
        "moment, and to the one action you can take right now."
    ),
    'duty': (
        "Identify the most important duty calling you today. Do it with full heart, without bargaining "
        "with results. The effort itself is the offering."
    ),
    'detachment': (
        "Practice releasing one expectation today. Do the work with full commitment, then let go of the "
        "outcome. Notice how much lighter that feels."
    ),
    'courage': (
        "Fear and courage live side by side. The Gita doesn't ask you to be fearless — only to act "
        "rightly despite the fear. Take one brave step today."
    ),
    'purpose': (
        "Sit quietly for five minutes. Ask: 'What is the most meaningful thing I can contribute?' "
        "Let the answer arise naturally, without forcing it."
    ),
    'mind': (
        "Your mind is your most powerful tool. Spend five minutes today in stillness — not trying to "
        "empty it, simply watching it. Observe without judgment."
    ),
    'soul': (
        "You are not your circumstances, roles, or emotions. Take a moment to rest in your deepest, "
        "unchanging self — the silent witness behind all experience."
    ),
    'devotion': (
        "Offer one act today entirely without expectation — do it as a gift to the divine in all things. "
        "Notice the peace and fullness that follows."
    ),
    'wisdom': (
        "True wisdom comes from experience, reflection, and stillness. Read this verse slowly today. "
        "Let one insight land fully before moving on."
    ),
    'equanimity': (
        "Practice being the observer of your emotions today — feel them fully, but stay rooted. "
        "Be the sky that holds the storm, not the storm itself."
    ),
    'karma yoga': (
        "Do your best work today without tracking who notices or what you'll receive. "
        "The quality of your effort is the practice itself."
    ),
    'surrender': (
        "What burden are you carrying that you don't need to carry alone? "
        "Offer it up. Trust that the universe holds more than your worry does."
    ),
    'jealousy': (
        "Another's success doesn't diminish yours. Find one thing to genuinely celebrate "
        "in someone you've been comparing yourself to."
    ),
    'addiction': (
        "Cravings are temporary visitors — they will pass. When an urge arises, pause for three slow "
        "breaths before responding. The gap is where freedom lives."
    ),
    'guilt': (
        "You cannot undo the past, only respond to it now. Forgive yourself as you would a dear friend "
        "who made a mistake. Then take one right action today."
    ),
}

DEFAULT_GUIDANCE = (
    "Sit with this verse today. Read it once slowly in the morning and once at night. "
    "Let its wisdom reveal itself gradually — understanding deepens over time."
)

STOP_WORDS = {
    'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have', 'from',
    'they', 'will', 'your', 'what', 'how', 'can', 'its', 'our', 'are',
    'was', 'has', 'had', 'not', 'been', 'were', 'would', 'could', 'should',
    'very', 'just', 'also', 'more', 'into', 'than', 'then', 'when', 'where',
    'who', 'which', 'there', 'their', 'about', 'after', 'being', 'each',
    'other', 'much', 'some', 'such', 'only', 'even', 'most', 'over', 'same',
    'one', 'all', 'those', 'these', 'him', 'his', 'her', 'upon', 'unto',
    'thus', 'nor', 'yet', 'both', 'neither', 'does', 'shall', 'must', 'may',
    'like', 'any', 'every', 'known', 'become', 'becomes', 'indeed', 'whose',
    'through', 'while', 'though', 'again', 'never', 'always', 'ever',
    'itself', 'himself', 'herself', 'myself', 'thyself', 'whatever',
    'wherever', 'however', 'therefore', 'without', 'within', 'among',
    'between', 'under', 'above', 'below', 'here', 'there', 'before',
    'during', 'since', 'until', 'toward', 'towards', 'verily',
}


# ── Fetch ─────────────────────────────────────────────────────────────────────

def fetch_verse(chapter: int, verse: int, retries: int = 3):
    params = {
        "language": "dv",
        "field_chapter_value": chapter,
        "field_nsutra_value": verse,
        "scsh": 1,      # Sanskrit shloka
        "htrskd": 1,    # Hindi: Swami Ramsukhdas (Gita Press)
        "etgb": 1,      # English: Swami Gambhirananda
        "choose": 1,
    }
    for attempt in range(retries):
        try:
            r = SESSION.get(BASE_URL, params=params, timeout=20)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            wait = 2 ** attempt
            if attempt < retries - 1:
                print(f"    Retry {attempt+1} for {chapter}.{verse} — waiting {wait}s ({e})")
                time.sleep(wait)
            else:
                print(f"    FAILED {chapter}.{verse}: {e}")
                return None


# ── Parse ─────────────────────────────────────────────────────────────────────

# IITK uses Drupal "Views" with field names in CSS classes like:
#   views-field-field-shloka    → Sanskrit
#   views-field-field-htrskd   → Hindi (Ramsukhdas)
#   views-field-field-etgb     → English (Gambhirananda)
# Each has a .views-field-body child with the actual text.

DEVANAGARI = re.compile(r'[ऀ-ॿ]')


def _text(el) -> str:
    """Get clean text from a BeautifulSoup element."""
    if el is None:
        return ""
    return re.sub(r'\s+', ' ', el.get_text(separator=" ", strip=True)).strip()


def parse_verse(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    sanskrit        = ""
    hindi           = ""
    english         = ""
    transliteration = ""

    # ── Strategy 1: IITK Drupal Views field classes ──────────────────────────
    # Each enabled field gets a div.views-field-field-<name>
    field_map = {
        "shloka":    "sanskrit",
        "scsh":      "sanskrit",
        "htrskd":    "hindi",
        "etgb":      "english",
        "translit":  "transliteration",
        "roman":     "transliteration",
    }
    for div in soup.find_all("div", class_=re.compile(r"views-field")):
        classes = " ".join(div.get("class", []))
        body = div.find(class_=re.compile(r"views-field-body|field-content"))
        content = _text(body or div)
        if not content:
            continue
        for key, target in field_map.items():
            if key in classes:
                if target == "sanskrit" and not sanskrit:
                    sanskrit = content
                elif target == "hindi" and not hindi:
                    hindi = content
                elif target == "english" and not english:
                    english = content
                elif target == "transliteration" and not transliteration:
                    transliteration = content

    # ── Strategy 2: Drupal field-name-* divs (older Drupal pattern) ──────────
    if not sanskrit or not hindi:
        for div in soup.find_all("div", class_=re.compile(r"field-name-")):
            classes = " ".join(div.get("class", []))
            item = div.find(class_=re.compile(r"field-item"))
            content = _text(item or div)
            if not content:
                continue
            if "shloka" in classes or "scsh" in classes:
                if not sanskrit:
                    sanskrit = content
            elif "htrskd" in classes:
                if not hindi:
                    hindi = content
            elif "etgb" in classes:
                if not english:
                    english = content

    # ── Strategy 3: scan labeled heading + following sibling ─────────────────
    if not sanskrit or not hindi:
        # Look for headings like "Swami Ramsukhdas", "Gambhirananda", "Shloka"
        heading_signals = {
            "ramsukh": "hindi",
            "gita press": "hindi",
            "gambhir": "english",
            "shloka": "sanskrit",
            "sanskrit": "sanskrit",
        }
        for heading in soup.find_all(["h3", "h4", "h5", "strong", "b", "td"]):
            text = heading.get_text(strip=True).lower()
            for signal, target in heading_signals.items():
                if signal in text:
                    # Get the next sibling paragraph or div
                    nxt = heading.find_next_sibling(["p", "div", "td"])
                    if nxt:
                        content = _text(nxt)
                        if content:
                            if target == "sanskrit" and not sanskrit:
                                sanskrit = content
                            elif target == "hindi" and not hindi:
                                hindi = content
                            elif target == "english" and not english:
                                english = content

    # ── Strategy 4: fallback — scan all paragraphs by script ─────────────────
    if not sanskrit or not hindi:
        paragraphs = soup.find_all("p")
        for p in paragraphs:
            content = _text(p)
            if not content or len(content) < 15:
                continue
            if DEVANAGARI.search(content):
                if not sanskrit:
                    sanskrit = content
                elif not hindi:
                    hindi = content
            else:
                # Skip navigation/boilerplate
                skip = any(s in content.lower() for s in [
                    'copyright', 'iit kanpur', 'supersite', 'home', 'login',
                    'search', 'menu', 'navigation',
                ])
                if not skip and len(content) > 40 and not english:
                    english = content

    # ── Clean up ──────────────────────────────────────────────────────────────
    def clean(t: str) -> str:
        t = re.sub(r'\s+', ' ', t).strip()
        t = re.sub(r'\s*\|\|\s*', ' ॥ ', t)   # normalise double-danda
        return t

    return {
        "sanskrit":        clean(sanskrit),
        "hindi":           clean(hindi),
        "english":         clean(english),
        "transliteration": clean(transliteration),
    }


# ── Theme / keyword helpers ───────────────────────────────────────────────────

def detect_themes(text: str) -> list:
    tl = text.lower()
    scored = defaultdict(int)
    for theme, signals in THEME_SIGNALS.items():
        for s in signals:
            if s in tl:
                scored[theme] += 1
    ranked = sorted(scored.items(), key=lambda x: x[1], reverse=True)
    top = [t for t, sc in ranked[:3] if sc > 0]
    return top or ["wisdom"]


def extract_keywords(text: str, themes: list) -> list:
    words  = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    filtered = [w for w in words if w not in STOP_WORDS]
    freq = defaultdict(int)
    for w in filtered:
        freq[w] += 1
    top = [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:6]]
    # enrich with theme signal words
    for theme in themes[:2]:
        for sig in THEME_SIGNALS.get(theme, [])[:2]:
            if re.match(r'^[a-z]+$', sig) and sig not in top:
                top.append(sig)
    for theme in themes[:2]:
        core = theme.split()[0]
        if core not in top:
            top.append(core)
    return list(dict.fromkeys(top))[:10]


def get_practical(themes: list) -> str:
    for t in themes:
        if t in PRACTICAL_GUIDANCE:
            return PRACTICAL_GUIDANCE[t]
    return DEFAULT_GUIDANCE


# ── Diagnostics ───────────────────────────────────────────────────────────────

def run_diagnostics(html: str, chapter: int, verse: int):
    """
    If the test parse returns empty fields, dump the page structure
    so the parser can be fixed. Called only on the first verse.
    """
    soup = BeautifulSoup(html, "html.parser")
    print("\n" + "─" * 60)
    print("DIAGNOSTICS — classes found in page body:")
    classes_seen = set()
    for el in soup.find_all(True):
        for c in el.get("class", []):
            if "field" in c or "view" in c:
                classes_seen.add(c)
    for c in sorted(classes_seen):
        print(f"  {c}")
    print("\nFirst 2000 chars of page text:")
    print(soup.get_text(separator="\n", strip=True)[:2000])
    print("─" * 60 + "\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    total_verses = sum(CHAPTER_VERSE_COUNTS.values())
    print("=" * 62)
    print("  Ask Madhav — 700-Verse Generator")
    print("  Hindi  : Swami Ramsukhdas (Gita Press, 1985)")
    print("  English: Swami Gambhirananda (Advaita Ashrama, 1995)")
    print("  Source : IIT Kanpur Gita Supersite")
    print(f"  Verses : {total_verses}")
    print("=" * 62)

    # ── Connectivity check + parser calibration ───────────────────────────────
    print("\nConnecting to IIT Kanpur Gita Supersite...")
    test_html = fetch_verse(2, 47)
    if not test_html:
        sys.exit(
            "\n✗ Could not reach gitasupersite.iitk.ac.in\n"
            "  Check your internet connection and try again.\n"
        )

    test = parse_verse(test_html)
    print(f"\nTest parse — BG 2.47 (the most famous verse):")
    print(f"  Sanskrit : {test['sanskrit'][:90] or '(empty)'}")
    print(f"  Hindi    : {test['hindi'][:90] or '(empty)'}")
    print(f"  English  : {test['english'][:90] or '(empty)'}")

    if not test['sanskrit'] and not test['english']:
        print("\n⚠  Parser returned empty fields for the test verse.")
        run_diagnostics(test_html, 2, 47)
        print("The parser needs tuning for this site's current HTML structure.")
        print("Please file an issue at github.com/Noopurtrivedi/ask-madhav")
        print("with the diagnostics above. Continuing with fallback text...\n")
    else:
        print("\n✓ Parser working — starting full extraction.\n")

    # ── Main loop ─────────────────────────────────────────────────────────────
    print(f"Fetching all {total_verses} verses (pausing 0.5s between requests)...")
    print("Estimated time: 15-20 minutes.\n")

    output  = []
    failed  = []
    verse_id = 1

    for ch in range(1, 19):
        n = CHAPTER_VERSE_COUNTS[ch]
        ch_ok = 0
        for v in range(1, n + 1):
            html = fetch_verse(ch, v)
            if html:
                p           = parse_verse(html)
                sanskrit    = p["sanskrit"]        or f"भगवद्गीता {ch}.{v}"
                hindi       = p["hindi"]           or f"भगवद्गीता अध्याय {ch}, श्लोक {v}।"
                english     = p["english"]         or f"Bhagavad Gita {ch}.{v}."
                translit    = p["transliteration"]
                ch_ok += 1
            else:
                sanskrit    = f"भगवद्गीता {ch}.{v}"
                hindi       = f"भगवद्गीता अध्याय {ch}, श्लोक {v}।"
                english     = f"Bhagavad Gita {ch}.{v}."
                translit    = ""
                failed.append(f"{ch}.{v}")

            themes   = detect_themes(english)
            keywords = extract_keywords(english, themes)
            practical = get_practical(themes)

            output.append({
                "id":                verse_id,
                "chapter_number":    ch,
                "verse_number":      v,
                "reference":         f"{ch}.{v}",
                "sanskrit_text":     sanskrit,
                "transliteration":   translit,
                "hindi_meaning":     hindi,
                "english_meaning":   english,
                "keywords":          keywords,
                "themes":            themes,
                "practical_guidance": practical,
            })
            verse_id += 1
            time.sleep(0.5)

        print(f"  ✓ Chapter {ch:2d}  ({ch_ok}/{n} verses fetched)")

    # ── Write output ──────────────────────────────────────────────────────────
    out_file = "verses_700.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 62}")
    print(f"  ✓ {len(output)} verses written to  {out_file}")
    if failed:
        n_fail = len(failed)
        sample = ', '.join(failed[:10]) + ('...' if n_fail > 10 else '')
        print(f"  ✗ {n_fail} verses used fallback text: {sample}")
    print(f"""
Next steps
──────────
1.  cp verses_700.json data/verses.json
2.  git add data/verses.json
3.  git commit -m "feat: all 700 verses from Gita Press (IIT Kanpur)"
4.  git push
    → Railway redeploys automatically and seeds all 700 verses

Attribution line for your app footer:
  "Sanskrit & Hindi Bhavartha: Swami Ramsukhdas, Sadhak-Sanjivani
   (Gita Press, Gorakhpur, 1985). Digitized by IIT Kanpur Gita Supersite.
   English: Swami Gambhirananda (Advaita Ashrama, 1995)."
{'=' * 62}
""")


if __name__ == "__main__":
    main()
