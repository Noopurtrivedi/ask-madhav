"""
Keyword-based verse retrieval engine.
Architecture is ready for pgvector semantic search — swap score_verses()
with an embedding similarity query when embeddings are populated.
"""
import re
from collections import defaultdict
from datetime import datetime


STOP_WORDS = {
    'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have', 'from',
    'they', 'will', 'your', 'what', 'how', 'can', 'its', 'our', 'are',
    'was', 'has', 'had', 'not', 'been', 'were', 'would', 'could', 'should',
    'very', 'just', 'also', 'more', 'into', 'than', 'then', 'when', 'where',
    'who', 'which', 'there', 'their', 'about', 'after', 'being', 'each',
    'other', 'much', 'some', 'such', 'only', 'even', 'most', 'over', 'same',
}

# Theme-to-keyword expansion map
THEME_EXPANSIONS = {
    'anger': ['angry', 'rage', 'furious', 'frustrat', 'irritat', 'annoy'],
    'grief': ['grieving', 'loss', 'mourn', 'sad', 'sorrow', 'bereave', 'died', 'death', 'dead'],
    'anxiety': ['anxious', 'worry', 'worrying', 'fear', 'scared', 'stress', 'panic', 'nervous'],
    'duty': ['job', 'work', 'career', 'responsib', 'obligat', 'task', 'role'],
    'detachment': ['attachment', 'letting go', 'release', 'outcome', 'result', 'expectation'],
    'courage': ['brave', 'fear', 'coward', 'giving up', 'quit', 'weak', 'strength'],
    'purpose': ['meaning', 'life', 'goal', 'direction', 'calling', 'mission'],
    'mind': ['focus', 'concentrat', 'distract', 'procrastinat', 'meditat'],
    'soul': ['death', 'dying', 'eternal', 'rebirth', 'spirit', 'atma'],
    'devotion': ['pray', 'faith', 'god', 'krishna', 'worship', 'surrender'],
    'jealousy': ['envy', 'jealous', 'colleague', 'success', 'competi'],
    'addiction': ['habit', 'craving', 'desire', 'temptation', 'compulsion'],
    'guilt': ['regret', 'mistake', 'past', 'shame', 'remorse', 'forgive'],
}


def build_keyword_index(verses):
    """Build inverted index: token → list of verse PKs."""
    index = defaultdict(set)
    for verse in verses:
        vid = verse.id
        for kw in verse.keywords or []:
            for token in kw.lower().split():
                index[token].add(vid)
        for theme in verse.themes or []:
            for token in theme.lower().split():
                index[token].add(vid)
    return index


def tokenize(text: str) -> set:
    tokens = set(re.findall(r'\b[a-zA-Z]{3,}\b', text.lower()))
    return tokens - STOP_WORDS


def expand_tokens(tokens: set) -> set:
    """Add domain synonyms to improve recall."""
    expanded = set(tokens)
    for token in list(tokens):
        for theme, synonyms in THEME_EXPANSIONS.items():
            if token in synonyms or any(token.startswith(s[:4]) for s in synonyms if len(s) >= 4):
                expanded.add(theme)
                expanded.update(synonyms[:2])
    return expanded


def score_verses(question: str, verses, index: dict) -> list:
    """
    Score all verses by keyword overlap with the question.
    Returns top-3 Verse objects ordered by relevance score.
    """
    tokens = expand_tokens(tokenize(question))
    scores = defaultdict(int)
    verse_map = {v.id: v for v in verses}

    for token in tokens:
        # Exact match
        for vid in index.get(token, []):
            scores[vid] += 3
        # Prefix match (e.g. "anxi" matches "anxiety")
        for kw, vids in index.items():
            if len(token) >= 4 and (kw.startswith(token) or token.startswith(kw)):
                for vid in vids:
                    scores[vid] += 1

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    result = []
    seen = set()
    for vid, score in ranked:
        if vid not in seen and score > 0:
            seen.add(vid)
            result.append(verse_map[vid])
        if len(result) >= 3:
            break

    # Fallback: return day-of-year verse so response is never empty
    if not result and verses:
        day = datetime.utcnow().timetuple().tm_yday
        result = [verses[day % len(verses)]]

    return result


THEME_OPENERS = {
    'detachment': "The Gita reminds us that inner peace comes when we release our grip on outcomes.",
    'duty': "Krishna's wisdom calls us to focus on our sacred duty, performed with a full heart.",
    'karma yoga': "Through selfless action, the Gita shows us a path beyond suffering.",
    'devotion': "Bhagavan Krishna assures us that sincere devotion is the surest path to peace.",
    'courage': "The Gita urges us to rise — not despite our fear, but through it.",
    'anger': "The Gita warns that uncontrolled anger clouds wisdom and leads to suffering.",
    'grief': "Even the greatest warrior, Arjuna, faced deep grief. The Gita holds space for your pain.",
    'wisdom': "True wisdom, says the Gita, is seeing the eternal Self beyond all temporary circumstances.",
    'soul': "You are not this body or these emotions — you are the eternal, indestructible soul.",
    'surrender': "When you surrender your burden to the Divine, true freedom begins.",
    'mind': "Your restless mind can be tamed — not by force, but by patient, consistent practice.",
    'equanimity': "The Gita calls us to be the unshaken center of the storm, not its victim.",
}


def build_answer(question: str, verses: list) -> dict:
    """Compose the full /ask response from retrieved verses."""
    if not verses:
        return {
            'question': question,
            'answer': "The Bhagavad Gita teaches that every question has a spiritual answer within.",
            'verses': [],
            'disclaimer': _disclaimer(),
        }

    verse = verses[0]
    opening = "The Bhagavad Gita speaks directly to your heart in this moment."
    for theme in (verse.themes or []):
        for key, phrase in THEME_OPENERS.items():
            if key in theme.lower():
                opening = phrase
                break
        else:
            continue
        break

    middle = (
        f"In Chapter {verse.chapter_number}, verse {verse.verse_number}, "
        f"Krishna teaches: \"{verse.english_meaning}\""
    )
    closing = "Sit with this wisdom today. Let it guide your next small step forward."
    answer_text = f"{opening} {middle} {closing}"

    verse_cards = [_verse_card(v) for v in verses]

    return {
        'question': question,
        'answer': answer_text,
        'verses': verse_cards,
        'disclaimer': _disclaimer(),
    }


def _verse_card(verse) -> dict:
    return {
        'chapter': verse.chapter_number,
        'verse': verse.verse_number,
        'reference': verse.reference,
        'sanskrit': verse.sanskrit_text,
        'transliteration': verse.transliteration,
        'hindi_meaning': verse.hindi_meaning,
        'english_meaning': verse.english_meaning,
        'practical_guidance': verse.practical_guidance or "Reflect on this verse today and take one small action aligned with its teaching.",
    }


def _disclaimer() -> str:
    return (
        "This guidance is inspired by the teachings of the Bhagavad Gita. "
        "It is not a substitute for medical, legal, or financial advice, "
        "and this chatbot does not speak as the divine Krishna."
    )
