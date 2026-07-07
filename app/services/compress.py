from __future__ import annotations

import re
from typing import Callable

from app.services.tokens import estimate_tokens

_PROTECTED_RE: list[re.Pattern] = [
    re.compile(r"```[\s\S]*?```"),
    re.compile(r"`[^`\n]+`"),
    re.compile(r"\bhttps?://\S+", re.I),
    re.compile(r"\b[\w.\-]*/[\w./\-]+"),
    re.compile(r"\b[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)+\b"),
    re.compile(r"\b\w+\.\w+(?:\.\w+)*\(\)?"),
    re.compile(r"[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)"),
    re.compile(r"\b\d+\.\d+\.\d+\b"),
]

_RE_FILLERS = re.compile(r"\b(?:just|really|basically|actually|simply|quite|very|essentially|literally)\b", re.I)
_RE_PLEASANTRIES = re.compile(r"\b(?:please|kindly|thank\s+you|thanks|sure|certainly|of\s+course|happy\s+to|i'?d\s+be\s+happy)\b[,.]?\s*", re.I)
_RE_HEDGES = re.compile(r"\b(?:perhaps|maybe|might|could\s+potentially|would\s+like\s+to|i\s+think|in\s+my\s+opinion|it\s+seems|it\s+appears)\b\s*", re.I)
_RE_LEADERS = re.compile(r"^(?:i'?ll|i\s+will|i\s+can|i'?d|you\s+can|we\s+will|we\s+can|let\s+me|let'?s)\s+", re.I | re.M)
_RE_ARTICLES = re.compile(r"\b(?:a|an|the)\s+(?=[a-z])", re.I)
_RE_MULTI_SPACE = re.compile(r"[ \t]{2,}")
_RE_PUNCT_SPACE = re.compile(r"\s+([,.;:!?])")
_RE_MULTI_NL = re.compile(r"\n{3,}")
_RE_SENT_CAP = re.compile(r"([.!?]\s+)([a-z])")


def _with_protected_segments(text: str, transform: Callable[[str], str]) -> str:
    segments: list[str] = []

    def protect(m: re.Match) -> str:
        idx = len(segments)
        segments.append(m.group(0))
        return f"\x00{idx}\x00"

    working = text
    for pat in _PROTECTED_RE:
        working = pat.sub(protect, working)

    out = transform(working)

    def restore(m: re.Match) -> str:
        idx = int(m.group(1))
        return segments[idx] if idx < len(segments) else ""

    return re.sub(r"\x00(\d+)\x00", restore, out)


def _compress_prose(text: str) -> str:
    s = _RE_LEADERS.sub("", text)
    s = _RE_PLEASANTRIES.sub("", s)
    s = _RE_HEDGES.sub("", s)
    s = _RE_FILLERS.sub("", s)
    s = _RE_ARTICLES.sub("", s)
    s = _RE_MULTI_SPACE.sub(" ", s)
    s = _RE_PUNCT_SPACE.sub(r"\1", s)
    s = _RE_MULTI_NL.sub("\n\n", s)
    s = s.strip()
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    return _RE_SENT_CAP.sub(lambda m: m.group(1) + m.group(2).upper(), s)


def caveman_compress(text: str) -> str:
    """Full caveman compression: protects code/URLs/paths/CONST_CASE/dotted calls/versions."""
    if not text:
        return text
    return _with_protected_segments(text, _compress_prose)


def compress_report(text: str) -> dict:
    compressed = caveman_compress(text)
    original_tok = estimate_tokens(text)
    compressed_tok = estimate_tokens(compressed)
    return {
        "original": text,
        "compressed": compressed,
        "tokens_saved": original_tok - compressed_tok,
        "compression_ratio": round(compressed_tok / max(original_tok, 1), 3),
        "savings_pct": round((original_tok - compressed_tok) / max(original_tok, 1) * 100, 1),
    }
