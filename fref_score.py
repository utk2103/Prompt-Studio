"""
FREF Score Module - Feature Reference Scoring System
Flesch-Kincaid readability formula implementation.
"""
import re


def count_syllables(word: str) -> int:
    """
    Estimate syllable count in a word.
    Uses vowel group counting with common rules.
    """
    word = word.lower()
    syllable_count = 0
    vowels = "aeiouy"
    previous_was_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel
    
    # Adjust for silent e
    if word.endswith("e"):
        syllable_count -= 1
    
    # Adjust for le at end
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        syllable_count += 1
    
    return max(1, syllable_count)


def fref_score(text: str) -> float:
    """
    Calculate FREF score using Flesch-Kincaid formula.
    
    Formula: 206.835 - 1.015(ASL) - 84.6(ASW)
    Where:
      ASL = Average Sentence Length (total words / total sentences)
      ASW = Average Syllables per Word (total syllables / total words)
    
    Args:
        text: The prompt text to score
        
    Returns:
        Float score (0-100+ range, clamped to min 0)
    """
    if not text or not text.strip():
        return 0.0
    
    # Count sentences (split on periods, exclamation marks, question marks, or newlines)
    sentences = re.split(r'[.!?\n]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    # Minimum 1 sentence, but if no punctuation found, treat as poorly structured
    total_sentences = max(len(sentences), 1)
    
    # Count words
    words = text.split()
    total_words = len(words)
    
    if total_words == 0:
        return 0.0
    
    # Count syllables
    total_syllables = sum(count_syllables(word) for word in words)
    
    # Calculate ASL and ASW
    asl = total_words / max(total_sentences, 1)
    asw = total_syllables / max(total_words, 1)
    
    # Apply Flesch-Kincaid formula
    score = 206.835 - (1.015 * asl) - (84.6 * asw)
    
    # Clamp to 0 minimum (negative scores indicate extremely complex text)
    # Clamp to 100 maximum (very simple text)
    score = max(0, min(100, score))
    
    return round(score, 2)
