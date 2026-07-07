from __future__ import annotations

import re


def count_syllables(word: str) -> int:
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e"):
        count -= 1
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        count += 1
    return max(1, count)


def fref_score(text: str) -> float:
    """Flesch-Kincaid Reading Ease. Range clamped to [0, 100]."""
    if not text or not text.strip():
        return 0.0
    sentences = [s for s in (s.strip() for s in re.split(r"[.!?\n]+", text)) if s]
    total_sentences = max(len(sentences), 1)
    words = text.split()
    if not words:
        return 0.0
    syllables = sum(count_syllables(w) for w in words)
    asl = len(words) / total_sentences
    asw = syllables / len(words)
    score = 206.835 - 1.015 * asl - 84.6 * asw
    return round(max(0.0, min(100.0, score)), 2)
