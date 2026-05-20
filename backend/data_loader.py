import json
import os
import re
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "data"


def load_verses():
    with open(DATA_DIR / "verses.json") as f:
        return json.load(f)


def load_stories():
    with open(DATA_DIR / "stories.json") as f:
        return json.load(f)


def build_keyword_index(verses):
    """Build inverted index: keyword -> list of verse IDs"""
    index = defaultdict(list)
    for verse in verses:
        vid = verse["id"]
        for kw in verse.get("keywords", []):
            index[kw.lower()].append(vid)
        for theme in verse.get("themes", []):
            for word in theme.lower().split():
                index[word].append(vid)
    return index


def score_verses(question: str, verses: list, index: dict) -> list:
    """Score verses by keyword overlap with question. Return top 3."""
    # Tokenize question
    tokens = set(re.findall(r'\b[a-zA-Z]{3,}\b', question.lower()))

    # Common stop words to ignore
    stop_words = {
        'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have', 'from',
        'they', 'will', 'your', 'what', 'how', 'can', 'its', 'our', 'are',
        'was', 'has', 'had', 'not', 'been', 'were', 'would', 'could', 'should',
        'very', 'just', 'too', 'all', 'any', 'more', 'also', 'out', 'get',
        'like', 'when', 'then', 'than', 'about', 'into', 'over', 'want', 'need',
        'feel', 'been', 'who', 'him', 'her', 'his', 'she', 'him', 'you', 'its'
    }
    tokens -= stop_words

    # Score each verse
    scores = defaultdict(int)
    verse_map = {v["id"]: v for v in verses}

    for token in tokens:
        # Exact match gets higher score
        for vid in index.get(token, []):
            scores[vid] += 2
        # Partial matching
        for kw in index.keys():
            if token in kw or kw in token:
                for vid in index[kw]:
                    scores[vid] += 1

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    # Return top 3 unique verses
    result = []
    seen = set()
    for vid, score in ranked[:10]:
        if vid not in seen and score > 0:
            seen.add(vid)
            result.append(verse_map[vid])
        if len(result) >= 3:
            break

    # If no match found, return daily verse as fallback
    if not result:
        from datetime import datetime
        day = datetime.now().timetuple().tm_yday
        result = [verses[day % len(verses)]]

    return result
