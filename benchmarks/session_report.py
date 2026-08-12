"""Session-log benchmark: baseline vs caveman vs lean/ponytail.

Parses Claude Code JSONL session logs, classifies each session by mode
(detected from SessionStart hook attachments), aggregates token/cost/response
metrics, emits JSON + SVG bar charts + a markdown report.

Stdlib only. Run:
    python benchmarks/session_report.py
"""
from __future__ import annotations

import json
import statistics
from datetime import datetime
from pathlib import Path

SESSIONS_DIR = Path.home() / ".claude/projects/-Users-utkarshupadhyay-Desktop-explore-Prompt-Studio"
OUT_DIR = Path(__file__).parent / "results/session_report"

# Pricing: USD per million tokens. Claude 4 family (approx public list).
PRICING = {
    "opus":   {"in": 15.00, "cache_w": 18.75, "cache_r": 1.50, "out": 75.00},
    "sonnet": {"in":  3.00, "cache_w":  3.75, "cache_r": 0.30, "out": 15.00},
    "haiku":  {"in":  0.80, "cache_w":  1.00, "cache_r": 0.08, "out":  4.00},
}


def model_family(model: str) -> str:
    m = (model or "").lower()
    if "opus" in m:   return "opus"
    if "sonnet" in m: return "sonnet"
    if "haiku" in m:  return "haiku"
    return "opus"  # unknown → conservative


def cost_usd(u: dict, model: str) -> float:
    p = PRICING[model_family(model)]
    return (
        u.get("input_tokens", 0)               * p["in"]      +
        u.get("cache_creation_input_tokens",0) * p["cache_w"] +
        u.get("cache_read_input_tokens", 0)    * p["cache_r"] +
        u.get("output_tokens", 0)              * p["out"]
    ) / 1_000_000


import re

_LEVEL_RE = re.compile(r"(?:level:\s*|\()(ultra|full|lite)")

def _tags_in(hay: str) -> list[str]:
    """Extract mode tags with level from one hook payload."""
    tags = []
    for name, marker in (("caveman", "CAVEMAN MODE ACTIVE"),
                         ("lean",    "LEAN MODE ACTIVE"),
                         ("ponytail","PONYTAIL MODE ACTIVE")):
        i = hay.find(marker)
        if i < 0: continue
        m = _LEVEL_RE.search(hay, i, i + 300)
        tags.append(f"{name}-{m.group(1)}" if m else name)
    # ponytail is the same skill as lean — collapse
    tags = [t.replace("ponytail", "lean") for t in tags]
    return sorted(set(tags))


def classify(text_blobs: list[str]) -> str:
    tags = _tags_in(" ".join(text_blobs))
    return "+".join(tags) if tags else "baseline"


def extract_output_text(msg: dict) -> str:
    parts = []
    for c in msg.get("content", []) or []:
        if isinstance(c, dict) and c.get("type") == "text":
            parts.append(c.get("text", ""))
    return "\n".join(parts)


def _blob(content) -> str:
    if isinstance(content, str):  return content
    if isinstance(content, list): return " ".join(str(x) for x in content)
    return ""


def parse_session(path: Path) -> dict:
    """Walk log in order; each assistant response is tagged with the mode
    that was active at that point (from the most recent hook payload)."""
    current_mode = "baseline"
    session_modes = set()
    assts = []
    for line in path.read_text().splitlines():
        try:
            o = json.loads(line)
        except json.JSONDecodeError:
            continue
        t = o.get("type")
        if t == "attachment":
            att = o.get("attachment", {}) or {}
            hn  = att.get("hookName", "")
            if hn in ("SessionStart:startup", "UserPromptSubmit"):
                tags = _tags_in(_blob(att.get("content", "")))
                if tags:
                    current_mode = "+".join(tags)
                    session_modes.add(current_mode)
        elif t == "assistant":
            m = o.get("message", {}) or {}
            u = m.get("usage") or {}
            if not u: continue
            assts.append({
                "mode":  current_mode,
                "model": m.get("model", ""),
                "usage": u,
                "ts":    o.get("timestamp", ""),
                "out_chars": len(extract_output_text(m)),
            })
    return {
        "session_id":  path.stem,
        "modes_seen":  sorted(session_modes) or ["baseline"],
        "assistants":  assts,
        "mtime":       path.stat().st_mtime,
    }


def aggregate(sessions: list[dict]) -> dict:
    by_mode: dict[str, dict] = {}
    sessions_per_mode: dict[str, set] = {}
    for s in sessions:
        for a in s["assistants"]:
            bucket = by_mode.setdefault(a["mode"], {
                "sessions": 0, "responses": 0,
                "in_tok": 0, "cache_w": 0, "cache_r": 0, "out_tok": 0,
                "out_chars_list": [], "out_tok_list": [], "cost": 0.0,
                "models": {},
            })
            sessions_per_mode.setdefault(a["mode"], set()).add(s["session_id"])
            u, m = a["usage"], a["model"]
            bucket["responses"]  += 1
            bucket["in_tok"]     += u.get("input_tokens", 0)
            bucket["cache_w"]    += u.get("cache_creation_input_tokens", 0)
            bucket["cache_r"]    += u.get("cache_read_input_tokens", 0)
            bucket["out_tok"]    += u.get("output_tokens", 0)
            bucket["out_tok_list"].append(u.get("output_tokens", 0))
            bucket["out_chars_list"].append(a["out_chars"])
            bucket["cost"]       += cost_usd(u, m)
            bucket["models"][m]   = bucket["models"].get(m, 0) + 1
    for mode, b in by_mode.items():
        b["sessions"] = len(sessions_per_mode[mode])

    for b in by_mode.values():
        n = max(b["responses"], 1)
        b["avg_out_tok"]     = b["out_tok"] / n
        b["avg_out_chars"]   = sum(b["out_chars_list"]) / n
        b["median_out_tok"]  = statistics.median(b["out_tok_list"])   if b["out_tok_list"]   else 0
        b["median_out_chars"]= statistics.median(b["out_chars_list"]) if b["out_chars_list"] else 0
        b["avg_cost"]        = b["cost"] / n
        del b["out_tok_list"], b["out_chars_list"]
    return by_mode


# --------------------------- SVG bar chart --------------------------- #

MODE_COLORS = {
    "baseline":         "#94a3b8",
    "caveman":          "#f59e0b",
    "lean":             "#10b981",
    "ponytail":         "#10b981",
    "caveman+lean":     "#6366f1",
    "caveman+ponytail": "#6366f1",
}


def svg_bar_chart(title: str, unit: str, data: list[tuple[str, float]]) -> str:
    """Horizontal bar chart. data: [(label, value), ...] sorted."""
    W, PAD_L, PAD_R, PAD_T, PAD_B = 720, 180, 120, 50, 30
    ROW_H, GAP = 34, 12
    H = PAD_T + PAD_B + len(data) * (ROW_H + GAP)
    max_v = max((v for _, v in data), default=1) or 1
    plot_w = W - PAD_L - PAD_R

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'font-family="ui-sans-serif,system-ui,sans-serif" font-size="13">',
        f'<rect width="{W}" height="{H}" fill="#0f172a"/>',
        f'<text x="{PAD_L}" y="26" fill="#e2e8f0" font-size="16" font-weight="600">{title}</text>',
        f'<text x="{W-PAD_R}" y="26" fill="#64748b" text-anchor="end">{unit}</text>',
    ]
    for i, (label, v) in enumerate(data):
        y = PAD_T + i * (ROW_H + GAP)
        w = max(2, plot_w * (v / max_v))
        color = MODE_COLORS.get(label, "#64748b")
        parts.append(f'<text x="{PAD_L-10}" y="{y+ROW_H/2+4}" fill="#cbd5e1" text-anchor="end">{label}</text>')
        parts.append(f'<rect x="{PAD_L}" y="{y}" width="{w:.1f}" height="{ROW_H}" fill="{color}" rx="4"/>')
        val_txt = f"{v:,.2f}" if v < 100 else f"{v:,.0f}"
        parts.append(f'<text x="{PAD_L+w+8}" y="{y+ROW_H/2+4}" fill="#e2e8f0">{val_txt}</text>')
    parts.append('</svg>')
    return "\n".join(parts)


# --------------------------- report writer --------------------------- #

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(SESSIONS_DIR.glob("*.jsonl"))
    sessions = [parse_session(f) for f in files]
    by_mode = aggregate(sessions)

    (OUT_DIR / "raw.json").write_text(json.dumps({
        "generated": datetime.now().isoformat(timespec="seconds"),
        "sessions_scanned": len(sessions),
        "by_mode": by_mode,
        "per_session": [
            {"id": s["session_id"], "modes_seen": s["modes_seen"],
             "responses": len(s["assistants"])}
            for s in sessions
        ],
    }, indent=2))

    # Charts (sorted so baseline anchors visual comparison)
    order = sorted(by_mode.keys(), key=lambda k: (k != "baseline", k))
    charts = [
        ("avg_out_tokens.svg",  "Avg output tokens per response",  "tokens",
         [(m, by_mode[m]["avg_out_tok"])   for m in order]),
        ("avg_out_chars.svg",   "Avg response length",             "chars",
         [(m, by_mode[m]["avg_out_chars"]) for m in order]),
        ("avg_cost.svg",        "Avg cost per response",           "USD",
         [(m, by_mode[m]["avg_cost"])      for m in order]),
        ("total_cost.svg",      "Total cost across all sessions",  "USD",
         [(m, by_mode[m]["cost"])          for m in order]),
        ("responses.svg",       "Total assistant responses",       "count",
         [(m, by_mode[m]["responses"])     for m in order]),
    ]
    for fname, title, unit, data in charts:
        (OUT_DIR / fname).write_text(svg_bar_chart(title, unit, data))

    # Markdown report
    base = by_mode.get("baseline", {})
    def delta(mode: str, key: str) -> str:
        if not base or mode == "baseline": return "—"
        b = base.get(key) or 0
        if not b: return "—"
        v = by_mode[mode].get(key, 0)
        return f"{(v-b)/b*100:+.0f}%"

    lines = [
        "# Session-log benchmark",
        "",
        f"Generated {datetime.now().isoformat(timespec='seconds')} from "
        f"{len(sessions)} session logs in `{SESSIONS_DIR}`.",
        "",
        "Each **assistant response** is bucketed by the mode active at that "
        "turn, detected from `SessionStart` and `UserPromptSubmit` hook "
        "injections. `sessions` counts distinct session files that contributed "
        "at least one response to the bucket.",
        "",
        "## Aggregates",
        "",
        "| Mode | Sessions | Responses | Avg out tok | Δ vs base | Avg chars | Δ vs base | Avg $/resp | Total $ |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for m in order:
        b = by_mode[m]
        lines.append(
            f"| `{m}` | {b['sessions']} | {b['responses']} | "
            f"{b['avg_out_tok']:.0f} | {delta(m,'avg_out_tok')} | "
            f"{b['avg_out_chars']:.0f} | {delta(m,'avg_out_chars')} | "
            f"${b['avg_cost']:.4f} | ${b['cost']:.2f} |"
        )
    lines += [
        "",
        "## Charts",
        "",
        "![Avg output tokens](avg_out_tokens.svg)",
        "",
        "![Avg response length](avg_out_chars.svg)",
        "",
        "![Avg cost per response](avg_cost.svg)",
        "",
        "![Total cost](total_cost.svg)",
        "",
        "![Responses](responses.svg)",
        "",
        "## Notes",
        "",
        "- `lean` and `ponytail` are the same skill under two names; sessions "
        "carrying both hooks land in a single `lean` bucket.",
        "- Pricing is Claude 4 family list price (opus/sonnet/haiku); each "
        "response is priced against the model reported in `message.model`.",
        "- No true baseline (mode-off) responses were found in these logs, so "
        "the `Δ vs base` columns are blank. To fill it in, run a session with "
        "all modes off (`stop caveman` / `stop lean`) before prompting.",
        "- `avg_chars` counts only text blocks in the response; pure tool-call "
        "responses show 0. Compare it alongside `avg out tok` — divergence "
        "means the mode is spending tokens on tool calls, not prose.",
    ]
    (OUT_DIR / "report.md").write_text("\n".join(lines))

    # stdout summary
    print(f"scanned {len(sessions)} sessions → {OUT_DIR}")
    print(f"{'mode':20} {'sess':>5} {'resp':>5} {'avg_tok':>8} {'avg_$':>8} {'total_$':>9}")
    for m in order:
        b = by_mode[m]
        print(f"{m:20} {b['sessions']:>5} {b['responses']:>5} "
              f"{b['avg_out_tok']:>8.0f} {b['avg_cost']:>8.4f} {b['cost']:>9.2f}")


if __name__ == "__main__":
    main()

    # self-check
    assert classify(["... CAVEMAN MODE ACTIVE — level: full ..."]) == "caveman-full"
    assert classify(["LEAN MODE ACTIVE — level: ultra", "PONYTAIL MODE ACTIVE — level: full"]) == "lean-full+lean-ultra"
    assert classify([]) == "baseline"
    assert classify(["CAVEMAN MODE ACTIVE", "LEAN MODE ACTIVE"]) == "caveman+lean"
    assert model_family("claude-opus-4-7") == "opus"
    assert model_family("claude-haiku-4-5-20251001") == "haiku"
    assert cost_usd({"input_tokens": 1_000_000}, "claude-sonnet-4-6") == 3.0
