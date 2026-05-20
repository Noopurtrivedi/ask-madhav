from datetime import datetime


def generate_compassionate_answer(question: str, verses: list) -> str:
    """
    Generate a compassionate intro answer grounded in the retrieved verses.
    For MVP, uses template-based generation tied to verse themes.
    """
    if not verses:
        return "The Bhagavad Gita teaches us that every question in life has a spiritual answer hidden within."

    verse = verses[0]
    themes = verse.get("themes", [])

    # Theme-based opening phrases
    theme_phrases = {
        "detachment": "The Gita reminds us that inner peace comes when we release our grip on outcomes.",
        "duty": "Krishna's wisdom calls us to focus on our sacred duty, performed with full heart.",
        "karma yoga": "Through selfless action, the Gita shows us a path beyond suffering.",
        "devotion": "Bhagavan Krishna assures us that sincere devotion is the surest path to peace.",
        "courage": "The Gita urges us to rise — not despite our fear, but through it.",
        "anger": "The Gita warns us that uncontrolled anger clouds wisdom and leads to suffering.",
        "grief": "Even the greatest warrior, Arjuna, faced deep grief. The Gita holds space for your pain.",
        "wisdom": "True wisdom, says the Gita, is seeing the eternal Self beyond all temporary circumstances.",
        "soul": "You are not this body or these emotions — you are the eternal, indestructible soul.",
        "surrender": "When you surrender your burden to the Divine, true freedom begins.",
        "impermanence": "The Gita teaches that all suffering is temporary — like seasons, they pass.",
        "self-mastery": "The Gita reminds us that we are both the obstacle and the solution.",
        "mind control": "Your restless mind can be tamed — not by force, but by patient, consistent practice.",
        "equanimity": "The Gita calls us to be the unshaken center of the storm, not its victim.",
        "liberation": "Liberation is not a distant destination — it begins with this very moment of surrender.",
        "divine protection": "The universe bends toward justice, and the divine never abandons those who seek it sincerely.",
        "faith": "Your faith shapes your reality. The Gita invites you to place it wisely.",
        "compassion": "The Gita's highest ideal is the soul who is a friend to all and a burden to none.",
        "leadership": "You are already influencing others — the question is: what are you teaching them by your example?",
    }

    opening = "The Bhagavad Gita speaks directly to your heart in this moment."
    for theme in themes:
        for key, phrase in theme_phrases.items():
            if key in theme.lower():
                opening = phrase
                break
        else:
            continue
        break

    # Build grounded answer
    middle = (
        f"In Chapter {verse['chapter_number']}, verse {verse['verse_number']}, "
        f"Krishna teaches: \"{verse['english_meaning']}\""
    )

    closing = "Sit with this wisdom today. Let it guide your next small step forward."

    return f"{opening}\n\n{middle}\n\n{closing}"


def build_response(question: str, verses: list) -> dict:
    answer = generate_compassionate_answer(question, verses)

    verse_cards = []
    for v in verses:
        verse_cards.append({
            "chapter": v["chapter_number"],
            "verse": v["verse_number"],
            "reference": v["reference"],
            "sanskrit": v["sanskrit_text"],
            "transliteration": v["transliteration"],
            "hindi_meaning": v["hindi_meaning"],
            "english_meaning": v["english_meaning"],
            "practical_guidance": v.get(
                "practical_guidance",
                "Reflect on this verse today and take one small action aligned with its teaching."
            )
        })

    return {
        "question": question,
        "answer": answer,
        "verses": verse_cards,
        "disclaimer": (
            "This guidance is inspired by the teachings of the Bhagavad Gita. "
            "It is not a substitute for medical, legal, or financial advice, "
            "and this application does not speak as the divine Krishna."
        )
    }
