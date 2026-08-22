"""Compute Lean token-usage stats for the current Claude Code session.

Reads the session's JSONL transcript (`~/.claude/projects/<slug>/<sid>.jsonl`),
sums `message.usage.*_tokens`, and formats a compact stats block. Estimated
savings use the benchmark median in `benchmarks/` (~65% output-token cut for
Lean vs baseline); shown as an estimate, not a per-session measurement.
"""
from __future__ import annotations

import json
import os
from pathlib import Path


# Median output-token savings from `benchmarks/` (Lean-full vs baseline).
# lean: single global constant, refit if the benchmark harness produces
# materially different numbers.
_SAVINGS_FRACTION = 0.65


def _projects_root() -> Path:
    for var in ("CLAUDE_STATE_DIR", "CLAUDE_CONFIG_DIR"):
        v = os.environ.get(var)
        if v:
            return Path(v) / "projects"
    return Path.home() / ".claude" / "projects"


def _find_session_file(payload: dict) -> Path | None:
    # Preferred: explicit transcript_path in the hook payload.
    tp = payload.get("transcript_path")
    if isinstance(tp, str) and tp:
        p = Path(tp)
        if p.is_file():
            return p
    sid = payload.get("session_id")
    root = _projects_root()
    if not root.is_dir():
        return None
    if isinstance(sid, str) and sid:
        # Try the project matching CLAUDE_PROJECT_DIR / PWD first.
        cwd = os.environ.get("CLAUDE_PROJECT_DIR") or os.environ.get("PWD") or ""
        slug = cwd.replace(os.sep, "-") if cwd else ""
        preferred = root / slug / f"{sid}.jsonl"
        if preferred.is_file():
            return preferred
        # Fallback: scan every project dir for a session file with that id.
        for pdir in root.iterdir():
            f = pdir / f"{sid}.jsonl"
            if f.is_file():
                return f
    # Last resort: most-recent jsonl under the cwd-matched project dir.
    cwd = os.environ.get("CLAUDE_PROJECT_DIR") or os.environ.get("PWD") or ""
    if cwd:
        pdir = root / cwd.replace(os.sep, "-")
        if pdir.is_dir():
            files = sorted(pdir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
            if files:
                return files[0]
    return None


def _aggregate(path: Path) -> dict:
    inp = out = cread = ccreate = turns = 0
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except ValueError:
                continue
            msg = d.get("message")
            if not isinstance(msg, dict):
                continue
            u = msg.get("usage")
            if not isinstance(u, dict):
                continue
            turns += 1
            inp += int(u.get("input_tokens") or 0)
            out += int(u.get("output_tokens") or 0)
            cread += int(u.get("cache_read_input_tokens") or 0)
            ccreate += int(u.get("cache_creation_input_tokens") or 0)
    return {
        "turns": turns,
        "input_tokens": inp,
        "output_tokens": out,
        "cache_read": cread,
        "cache_creation": ccreate,
    }


def _fmt(n: int) -> str:
    return f"{n:,}"


def format_stats(payload: dict, mode: str) -> str:
    path = _find_session_file(payload)
    if path is None:
        return "LEAN STATS: no session transcript found. Run at least one prompt in this session first."
    s = _aggregate(path)
    if s["turns"] == 0:
        return f"LEAN STATS: transcript {path.name} has no usage records yet."
    # Estimate baseline output tokens: if Lean cuts output by SAVINGS_FRACTION,
    # baseline = actual / (1 - SAVINGS_FRACTION); saved = baseline - actual.
    baseline_out = int(round(s["output_tokens"] / (1 - _SAVINGS_FRACTION))) if _SAVINGS_FRACTION < 1 else s["output_tokens"]
    saved_out = baseline_out - s["output_tokens"]
    lines = [
        f"LEAN STATS ({mode}) — session {path.stem[:8]}",
        f"  Turns:              {_fmt(s['turns'])}",
        f"  Input tokens:       {_fmt(s['input_tokens'])}",
        f"  Cache read:         {_fmt(s['cache_read'])}",
        f"  Cache creation:     {_fmt(s['cache_creation'])}",
        f"  Output tokens:      {_fmt(s['output_tokens'])}",
        f"  Est. output saved:  ~{_fmt(saved_out)} (baseline ~{_fmt(baseline_out)}, benchmark median {int(_SAVINGS_FRACTION*100)}%)",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    # lean: tiny self-check — the formatter must not crash on empty input and
    # must produce the header line on a fabricated transcript.
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        # Isolate projects root + wipe cwd hints so the "no transcript" branch
        # can't accidentally hit a real ~/.claude/projects/ file.
        os.environ["CLAUDE_STATE_DIR"] = td
        for k in ("CLAUDE_PROJECT_DIR", "PWD"):
            os.environ.pop(k, None)
        assert "no session transcript" in format_stats({}, "full")

        p = Path(td) / "abc12345.jsonl"
        p.write_text(
            json.dumps({"message": {"usage": {"input_tokens": 10, "output_tokens": 20,
                                              "cache_read_input_tokens": 5, "cache_creation_input_tokens": 7}}}) + "\n"
            + json.dumps({"message": {"usage": {"input_tokens": 3, "output_tokens": 40,
                                                "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}}}) + "\n"
            + "not-json\n"
            + json.dumps({"type": "no-message"}) + "\n",
            encoding="utf-8",
        )
        out = format_stats({"transcript_path": str(p)}, "ultra")
        assert "LEAN STATS (ultra)" in out
        assert "Turns:              2" in out
        assert "Output tokens:      60" in out
    print("ok")
