#!/usr/bin/env python3
"""Test 20 real-life questions against the verse matching engine."""
import sys
sys.path.insert(0, '.')

from data_loader import load_verses, load_stories, build_keyword_index, score_verses
from answer_generator import build_response


def test_all():
    verses = load_verses()
    stories = load_stories()
    index = build_keyword_index(verses)

    questions = [
        "I feel like giving up on my job",
        "How do I deal with anxiety about the future?",
        "My friend betrayed me, I'm angry",
        "Should I leave my toxic relationship?",
        "I'm grieving the loss of a loved one",
        "How can I control my anger?",
        "I feel like I'm failing as a parent",
        "I'm scared of death",
        "How do I find my purpose in life?",
        "I'm jealous of my colleague's success",
        "I procrastinate and can't focus",
        "My boss is very unfair to me",
        "I'm struggling with addiction",
        "How do I stay calm in a crisis?",
        "I feel lonely and disconnected",
        "Should I follow my passion or a stable career?",
        "I'm overwhelmed by responsibilities",
        "How do I meditate properly?",
        "I feel guilty about past mistakes",
        "What is the meaning of life?"
    ]

    print(f"{'='*70}")
    print(f"ASK MADHAV — VERSE MATCHING TEST ({len(verses)} verses loaded)")
    print(f"{'='*70}\n")

    matched = 0
    for i, q in enumerate(questions, 1):
        matched_verses = score_verses(q, verses, index)
        response = build_response(q, matched_verses)
        refs = [f"{v['reference']}" for v in response['verses']]
        has_match = len(matched_verses) > 0
        if has_match:
            matched += 1
        status = "OK" if has_match else "MISS"
        print(f"[{status}] Q{i:02d}: {q}")
        print(f"       -> Verses: {', '.join(refs)}")
        print(f"       -> Answer: {response['answer'][:120].strip()}...")
        print()

    print(f"{'='*70}")
    print(f"Results: {matched}/{len(questions)} questions matched to verses")
    print(f"{'='*70}")


if __name__ == "__main__":
    test_all()
