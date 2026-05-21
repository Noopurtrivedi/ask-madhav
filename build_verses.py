#!/usr/bin/env python3
"""
build_verses.py
───────────────
Produces a CLEAN, complete 700-verse dataset for Ask Madhav.

Why this exists
───────────────
The earlier `generate_verses.py` scraped IIT Kanpur's Gita Supersite but its
parser grabbed the WRONG Sanskrit field — it captured Sri Shankaracharya's
*commentary* (`views-field-field-scsh`) instead of the original verse, left
every transliteration empty, prefixed Hindi/English with "… Translation By …",
and polluted the keyword index with tokens like "english", "translation",
"swami". Shipping that file would degrade search and show commentary as the
shloka. The clean original verse is the "Mool Shloka" panel, exposed by the
`show_mool=true` request parameter.

What this does
──────────────
1. Reads the existing `verses_700.json` for Hindi / English / themes / practical
   guidance, and STRIPS the "… Translation By … <ref>" prefixes.
2. Re-derives clean keywords (drops attribution/pollutant tokens).
3. Scrapes the clean Mool Shloka (Devanagari) per verse — resumable via a local
   cache so a dropped run continues where it stopped.
4. Generates an IAST transliteration from the clean Devanagari, deterministically
   and offline (no API, no extra dependency).
5. Overlays the hand-curated rich verses from `frontend/data/verses.json`
   (perfect Sanskrit + transliteration) — these win for the ~30 verses we curated.
6. Writes the merged result to `frontend/data/verses.json` (and `verses_clean.json`).

Run:  python3 build_verses.py            # full build (scrapes ~700 pages)
      python3 build_verses.py --no-scrape  # clean/merge only, skip network
"""

import json
import re
import sys
import time
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
# Stable, hand-curated 30 verses (rich Sanskrit + transliteration). This is the
# override source and is NEVER written to — kept separate from the build output
# so a re-run can't clobber it.
RAW = os.path.join(ROOT, "verses_700.json")
CURATED = os.path.join(ROOT, "frontend", "data", "verses.curated.json")
CACHE = os.path.join(ROOT, ".shloka_cache.json")
OUT_REPO = os.path.join(ROOT, "verses_clean.json")
OUT_APP = os.path.join(ROOT, "frontend", "data", "verses.json")

# ── Devanagari → IAST transliteration ────────────────────────────────────────
# Deterministic, offline. Standard IAST diacritics.
VIRAMA = "्"
ANUSVARA = "ं"
CANDRABINDU = "ँ"
VISARGA = "ः"
AVAGRAHA = "ऽ"
NUKTA = "़"

INDEP_VOWELS = {
    "अ": "a", "आ": "ā", "इ": "i", "ई": "ī", "उ": "u", "ऊ": "ū",
    "ऋ": "ṛ", "ॠ": "ṝ", "ऌ": "ḷ", "ॡ": "ḹ",
    "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऎ": "e", "ऒ": "o",
    "ऍ": "ê", "ऑ": "ô",
}
MATRAS = {
    "ा": "ā", "ि": "i", "ी": "ī", "ु": "u", "ू": "ū",
    "ृ": "ṛ", "ॄ": "ṝ", "ॢ": "ḷ", "ॣ": "ḹ",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॆ": "e", "ॊ": "o",
    "ॅ": "ê", "ॉ": "ô",
}
CONSONANTS = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ṅ",
    "च": "c", "छ": "ch", "ज": "j", "झ": "jh", "ञ": "ñ",
    "ट": "ṭ", "ठ": "ṭh", "ड": "ḍ", "ढ": "ḍh", "ण": "ṇ",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v",
    "श": "ś", "ष": "ṣ", "स": "s", "ह": "h", "ळ": "ḻ",
}
NUKTA_CONSONANTS = {
    "क": "q", "ख": "k͟h", "ग": "ġ", "ज": "z", "ड": "ṛ", "ढ": "ṛh",
    "फ": "f", "य": "ẏ",
}
DIGITS = {"०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
          "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"}


def transliterate(text: str) -> str:
    """Devanagari → IAST. Handles inherent 'a', matras, virama clusters,
    anusvara, visarga, candrabindu, nukta, avagraha and digits."""
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in CONSONANTS:
            base = CONSONANTS[ch]
            # nukta variant?
            if i + 1 < n and text[i + 1] == NUKTA:
                base = NUKTA_CONSONANTS.get(ch, base)
                i += 1
            nxt = text[i + 1] if i + 1 < n else ""
            if nxt == VIRAMA:
                out.append(base)
                i += 2
                continue
            if nxt in MATRAS:
                out.append(base + MATRAS[nxt])
                i += 2
                continue
            out.append(base + "a")
            i += 1
            continue
        if ch in INDEP_VOWELS:
            out.append(INDEP_VOWELS[ch])
        elif ch == ANUSVARA:
            out.append("ṃ")
        elif ch == CANDRABINDU:
            out.append("m̐")
        elif ch == VISARGA:
            out.append("ḥ")
        elif ch == AVAGRAHA:
            out.append("'")
        elif ch == "ॐ":
            out.append("oṃ")
        elif ch in DIGITS:
            out.append(DIGITS[ch])
        elif ch == "।":
            out.append(",")
        elif ch == "॥":
            out.append("")
        else:
            out.append(ch)
        i += 1
    # tidy spacing around the comma we substituted for the danda
    return re.sub(r"\s*,\s*", ", ", re.sub(r"\s+", " ", "".join(out))).strip().rstrip(",")


# ── Cleaning helpers ──────────────────────────────────────────────────────────
POLLUTANT_KW = {
    "english", "translation", "sanskrit", "hindi", "commentary", "swami",
    "gambirananda", "gambhirananda", "ramsukhdas", "shankaracharya", "sri",
    "bhavartha", "shloka", "mool", "verse", "chapter", "gita", "bhagavad",
    "translated", "translator", "edition", "press",
}


def _strip_zw(t: str) -> str:
    # Drop BOM / zero-width chars that defeat the ^prefix regexes (seen on 18.2).
    return t.replace("﻿", "").replace("​", "").replace("‌", "").replace("‍", "")


def strip_english(t: str) -> str:
    # "English Translation By Swami Gambirananda 2.47 <text>"
    t = _strip_zw(t)
    t = re.sub(r"^\s*English Translation By .*?\b\d{1,2}\.\d{1,3}\s*", "", t)
    return re.sub(r"\s+", " ", t).strip()


def strip_hindi(t: str) -> str:
    # "Hindi Translation By Swami Ramsukhdas ।।2.47।। <text>"
    t = _strip_zw(t)
    t = re.sub(r"^\s*Hindi Translation By .*?।।\s*[\d.]+\s*।।\s*", "", t)
    t = re.sub(r"^\s*Hindi Translation By .*?\b\d{1,2}\.\d{1,3}\s*", "", t)
    return re.sub(r"\s+", " ", t).strip()


# The Gita has only four speakers; their attribution lines precede some verses.
# Match ONLY these names so verse content like "तमुवाच हृषीकेशः" (2.10, "said to
# him") is never mistaken for a speaker label and stripped.
SPEAKER_TAG = re.compile(
    r"^(?:"
    r"(?:श्री\s*)?भगवान[ुउ]वाच"          # (श्री) भगवानुवाच — Krishna (sandhi)
    r"|धृतराष्ट्र\s*उवाच"
    r"|(?:सञ्जय|संजय)\s*उवाच"
    r"|अर्जुन\s*उवाच"
    r")\s+"
)


def clean_mool(t: str, ch: int, v: int) -> str:
    """Strip the 'मूल श्लोकः' label, a leading speaker tag, and the trailing ref."""
    t = _strip_zw(re.sub(r"\s+", " ", t)).strip()
    # label: handles both श्लोकः and the स्लोकः spelling variant (11.17)
    t = re.sub(r"^मूल\s*\S*लोकः\s*", "", t)
    t = SPEAKER_TAG.sub("", t)
    # trailing "।।2.47।।" / "॥2.47॥"
    t = re.sub(r"\s*[।॥]+\s*\d+\s*[.।]*\s*\d+\s*[।॥]+\s*$", "", t).strip()
    return t


def clean_keywords(kw, english: str, themes) -> list:
    cleaned = [w for w in (kw or []) if w.lower() not in POLLUTANT_KW and len(w) >= 3]
    # backfill from english if we lost too many
    if len(cleaned) < 4:
        words = re.findall(r"\b[a-z]{4,}\b", english.lower())
        for w in words:
            if w not in POLLUTANT_KW and w not in cleaned:
                cleaned.append(w)
            if len(cleaned) >= 8:
                break
    # ensure theme words present
    for th in (themes or []):
        head = th.split()[0]
        if head not in cleaned:
            cleaned.append(head)
    return list(dict.fromkeys(cleaned))[:10]


# ── Scrape (Mool Shloka only) ──────────────────────────────────────────────────
BASE = "https://www.gitasupersite.iitk.ac.in/srimad"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.gitasupersite.iitk.ac.in/"}
DEV = re.compile(r"[ऀ-ॿ]")
WORKERS = 8


def _fetch_one(ref):
    """Fetch a single verse's raw Mool Shloka block. Returns (ref, raw_text)."""
    import requests
    from bs4 import BeautifulSoup

    ch, v = map(int, ref.split("."))
    params = {"language": "dv", "field_chapter_value": ch,
              "field_nsutra_value": v, "show_mool": "true", "choose": 1}
    for attempt in range(3):
        try:
            r = requests.get(BASE, params=params, headers=HEADERS, timeout=25)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "html.parser")
            for body in soup.select("div.views-field-body"):
                bt = re.sub(r"\s+", " ", body.get_text(" ", strip=True)).strip()
                if not DEV.search(bt):
                    continue
                if "Translation By" in bt or "Commentary By" in bt:
                    continue
                if "मूल" in bt or f"।।{ch}.{v}" in bt or bt.endswith(f"{ch}.{v}।।"):
                    return ref, bt  # RAW; cleaned at build time
            return ref, ""
        except Exception as e:
            if attempt == 2:
                print(f"    FAILED {ref}: {e}", flush=True)
                return ref, ""
            time.sleep(2 ** attempt)
    return ref, ""


def scrape_mool(verses_needed):
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import threading

    cache = {}
    if os.path.exists(CACHE):
        cache = json.load(open(CACHE, encoding="utf-8"))

    todo = [r for r in verses_needed if not cache.get(r)]
    print(f"  shlokas cached: {sum(1 for x in cache.values() if x)}  to fetch: {len(todo)}", flush=True)

    lock = threading.Lock()
    done = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(_fetch_one, r) for r in todo]
        for fut in as_completed(futures):
            ref, text = fut.result()
            with lock:
                cache[ref] = text
                done += 1
                if done % 50 == 0:
                    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
                    print(f"    fetched {done}/{len(todo)}", flush=True)
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    return cache


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    no_scrape = "--no-scrape" in sys.argv
    raw = json.load(open(RAW, encoding="utf-8"))
    curated = {v["reference"]: v for v in json.load(open(CURATED, encoding="utf-8"))}
    print(f"Loaded {len(raw)} raw verses, {len(curated)} curated overrides.")

    refs = [v["reference"] for v in raw]
    shlokas = {}
    if not no_scrape:
        shlokas = scrape_mool(refs)
    elif os.path.exists(CACHE):
        shlokas = json.load(open(CACHE, encoding="utf-8"))

    out = []
    for v in raw:
        ref = v["reference"]
        if ref in curated:
            out.append(curated[ref])  # hand-curated wins, untouched
            continue
        ch, vn = v["chapter_number"], v["verse_number"]
        english = strip_english(v["english_meaning"])
        hindi = strip_hindi(v["hindi_meaning"])
        sanskrit = clean_mool(shlokas.get(ref, ""), ch, vn) if shlokas.get(ref) else ""
        translit = transliterate(sanskrit) if sanskrit else ""
        out.append({
            "id": v["id"],
            "chapter_number": ch,
            "verse_number": vn,
            "reference": ref,
            "sanskrit_text": sanskrit,
            "transliteration": translit,
            "hindi_meaning": hindi,
            "english_meaning": english,
            "keywords": clean_keywords(v.get("keywords"), english, v.get("themes")),
            "themes": v.get("themes", []),
            "practical_guidance": v.get("practical_guidance", ""),
        })

    out.sort(key=lambda x: (x["chapter_number"], x["verse_number"]))
    json.dump(out, open(OUT_REPO, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(out, open(OUT_APP, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    # ── Report ──
    miss_sk = [v["reference"] for v in out if not v["sanskrit_text"]]
    miss_en = [v["reference"] for v in out if not v["english_meaning"]]
    print(f"\nWrote {len(out)} verses → {OUT_APP}")
    print(f"  missing sanskrit: {len(miss_sk)}  missing english: {len(miss_en)}")
    if miss_sk[:10]:
        print(f"  sample missing sanskrit: {miss_sk[:10]}")


if __name__ == "__main__":
    main()
