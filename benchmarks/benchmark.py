"""Lean benchmark driver — measures LOC, latency, tokens, cost across arms.

Arms: baseline / caveman / lean-lite / lean-full / lean-ultra
Backends: Anthropic API (--backend anthropic) or Ollama (--backend ollama)

Usage:
    python benchmarks/benchmark.py --backend ollama --model llama3.2 --repeat 3
    ANTHROPIC_API_KEY=... python benchmarks/benchmark.py \\
        --backend anthropic --model claude-haiku-4-5-20251001 --repeat 5

Tasks include the same five that the ponytail benchmark uses, plus two
Prompt-Studio-specific tasks that exercise the per-provider adapters in
app/services/formats.py.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from benchmarks.arms import ARMS  # noqa: E402

TASKS: list[tuple[str, str]] = [
    ("email",      "Write me a Python function that validates email addresses."),
    ("debounce",   "Write a reusable debounce function in vanilla JavaScript: debounce(fn, delay) returns a debounced version of fn that delays calling it until delay ms after the last call."),
    ("csv-sum",    "Write Python code that reads sales.csv and sums the 'amount' column."),
    ("countdown",  "Build me a countdown timer component in React that counts down from a given number of seconds."),
    ("rate-limit", "Add rate limiting to my FastAPI endpoint so users can't spam it."),
    # Prompt-Studio-specific: exercises per-provider adapters.
    ("chatml2xml", "Write a Python function that converts an OpenAI ChatML message list [{role, content}, ...] to Anthropic's XML-tag format (<prompt><mode>...</mode><content>...</content></prompt>)."),
    ("cost-est",   "Write a Python function that estimates prompt token count and USD cost given a model's per-1M input/output pricing. Use a 4-char-per-token heuristic."),
]

_CODE_FENCE = re.compile(r"```[a-zA-Z0-9_+\-]*\n([\s\S]*?)```")
_COMMENT_PREFIXES = ("//", "#", "*/", "/*", "*")


def count_loc(text: str) -> int:
    """Non-blank, non-comment lines in fenced blocks (or the whole text if no fence)."""
    blocks = _CODE_FENCE.findall(text)
    lines = ("\n".join(blocks) if blocks else text).splitlines()
    return sum(1 for l in lines if l.strip() and not l.strip().startswith(_COMMENT_PREFIXES))


def _post(url: str, payload: dict, headers: dict, timeout: int = 300) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def call_ollama(model: str, messages: list[dict], base_url: str) -> tuple[str, dict]:
    t0 = time.time()
    data = _post(
        f"{base_url}/api/chat",
        {"model": model, "messages": messages, "stream": False, "options": {"temperature": 0.7}},
        headers={},
    )
    return data["message"]["content"], {
        "elapsed": round(time.time() - t0, 2),
        "input_tokens": data.get("prompt_eval_count"),
        "output_tokens": data.get("eval_count"),
        "cost": None,
    }


def call_anthropic(model: str, messages: list[dict]) -> tuple[str, dict]:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    system = ""
    user_msgs = []
    for m in messages:
        if m["role"] == "system":
            system = m["content"]
        else:
            user_msgs.append(m)
    payload = {"model": model, "max_tokens": 8192, "temperature": 1.0, "messages": user_msgs}
    if system:
        payload["system"] = system
    t0 = time.time()
    data = _post(
        "https://api.anthropic.com/v1/messages",
        payload,
        headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
    )
    text = "".join(c.get("text", "") for c in data.get("content", []) if c.get("type") == "text")
    usage = data.get("usage", {})
    return text, {
        "elapsed": round(time.time() - t0, 2),
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "cost": _anthropic_cost(model, usage),
    }


# Per-1M-token USD pricing. Extend as models change.
_PRICING = {
    "claude-haiku-4-5-20251001":  {"in": 1.00,  "out":  5.00},
    "claude-sonnet-4-6":          {"in": 3.00,  "out": 15.00},
    "claude-opus-4-8":            {"in": 15.00, "out": 75.00},
    "gemini-2.5-flash-lite":      {"in": 0.10,  "out":  0.40},
    "gemini-2.5-flash":           {"in": 0.30,  "out":  2.50},
    "gemini-2.5-pro":             {"in": 1.25,  "out": 10.00},
    "gpt-4o-mini":                {"in": 0.15,  "out":  0.60},
    "gpt-4o":                     {"in": 2.50,  "out": 10.00},
    "gpt-4.1-mini":               {"in": 0.40,  "out":  1.60},
    "gpt-4.1":                    {"in": 2.00,  "out":  8.00},
    "gpt-5-mini":                 {"in": 0.25,  "out":  2.00},
    "gpt-5":                      {"in": 1.25,  "out": 10.00},
}


def call_openai(model: str, messages: list[dict]) -> tuple[str, dict]:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY not set")
    payload = {"model": model, "messages": messages, "temperature": 1.0}
    t0 = time.time()
    data = _post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        headers={"Authorization": f"Bearer {key}"},
    )
    choice = (data.get("choices") or [{}])[0]
    text = (choice.get("message") or {}).get("content", "") or ""
    usage = data.get("usage", {}) or {}
    in_tok  = usage.get("prompt_tokens", 0)
    out_tok = usage.get("completion_tokens", 0)
    return text, {
        "elapsed":       round(time.time() - t0, 2),
        "input_tokens":  in_tok,
        "output_tokens": out_tok,
        "cost":          _cost(model, in_tok, out_tok),
    }


def _cost(model: str, in_tok: int, out_tok: int) -> float | None:
    p = _PRICING.get(model)
    if not p:
        return None
    return round(in_tok / 1e6 * p["in"] + out_tok / 1e6 * p["out"], 6)


def _anthropic_cost(model: str, usage: dict) -> float | None:
    if not usage:
        return None
    return _cost(model, usage.get("input_tokens", 0), usage.get("output_tokens", 0))


def call_gemini(model: str, messages: list[dict]) -> tuple[str, dict]:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) not set")
    system_text = ""
    contents = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
        else:
            role = "model" if m["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
    payload = {
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 8192, "temperature": 1.0},
    }
    if system_text:
        payload["systemInstruction"] = {"parts": [{"text": system_text}]}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    t0 = time.time()
    data = _post(url + f"?key={urllib.parse.quote(key)}", payload, headers={})
    cands = data.get("candidates") or []
    text = ""
    if cands:
        for part in cands[0].get("content", {}).get("parts", []) or []:
            text += part.get("text", "")
    usage = data.get("usageMetadata", {}) or {}
    in_tok  = usage.get("promptTokenCount", 0)
    out_tok = usage.get("candidatesTokenCount", 0)
    return text, {
        "elapsed":       round(time.time() - t0, 2),
        "input_tokens":  in_tok,
        "output_tokens": out_tok,
        "cost":          _cost(model, in_tok, out_tok),
    }


def run(backend: str, model: str, repeat: int, base_url: str) -> dict:
    if backend == "ollama":
        call = lambda msgs: call_ollama(model, msgs, base_url)
    elif backend == "gemini":
        call = lambda msgs: call_gemini(model, msgs)
    elif backend == "openai":
        call = lambda msgs: call_openai(model, msgs)
    else:
        call = lambda msgs: call_anthropic(model, msgs)
    task_ids = [t[0] for t in TASKS]
    results = {arm: {t: [] for t in task_ids} for arm in ARMS}
    total = len(ARMS) * len(TASKS) * repeat
    done = 0
    for r in range(repeat):
        for arm_name, arm_fn in ARMS.items():
            for task_id, task_prompt in TASKS:
                done += 1
                print(f"[{done}/{total}] run{r+1} {arm_name:12s} / {task_id} ...", end=" ", flush=True)
                response, meta = call(arm_fn(task_prompt))
                loc = count_loc(response)
                cell = {"loc": loc, **meta, "response": response}
                results[arm_name][task_id].append(cell)
                cost_str = f" ${meta['cost']:.4f}" if meta.get("cost") is not None else ""
                print(f"{loc} LOC  {meta['elapsed']}s{cost_str}")
    return results


def summarize(results: dict, model: str, repeat: int) -> None:
    task_ids = list(next(iter(results.values())).keys())

    def med(cells: list[dict], key: str) -> float:
        vals = [c[key] for c in cells if c.get(key) is not None]
        return statistics.median(vals) if vals else 0

    print(f"\n{'=' * 72}\n  RESULTS - {model}  (n={repeat}, median)\n{'=' * 72}")
    for metric, unit in (("loc", "LOC"), ("elapsed", "s"), ("cost", "$")):
        print(f"\n{metric.capitalize()} per task (median, {unit})")
        for arm in results:
            row = [med(results[arm][t], metric) for t in task_ids]
            fmt = "{:>10.2f}" if metric != "loc" else "{:>10.0f}"
            print(f"  {arm:12s}" + "".join(fmt.format(v) for v in row) + f"   total={sum(row):.2f}")

    print(f"\n{'=' * 72}\n  vs baseline (LOC totals)\n{'=' * 72}")
    base = sum(med(results["baseline"][t], "loc") for t in task_ids) or 1
    for arm in results:
        if arm == "baseline":
            continue
        arm_total = sum(med(results[arm][t], "loc") for t in task_ids)
        pct = (1 - arm_total / base) * 100
        print(f"  {arm:12s}: {arm_total:.0f} LOC  ({abs(pct):.0f}% {'less' if pct >= 0 else 'more'} than baseline)")


def main() -> None:
    p = argparse.ArgumentParser(description="Lean benchmark driver")
    p.add_argument("--backend", choices=["anthropic", "ollama", "gemini", "openai"], default="ollama")
    p.add_argument("--model", default="llama3.2")
    p.add_argument("--repeat", type=int, default=1)
    p.add_argument("--ollama-url", default="http://localhost:11434")
    p.add_argument("--out", default=str(Path(__file__).parent / "results" / "latest.json"))
    args = p.parse_args()

    if args.backend == "ollama":
        parsed = urllib.parse.urlparse(args.ollama_url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            p.error(f"invalid --ollama-url: {args.ollama_url!r}")

    results = run(args.backend, args.model, args.repeat, args.ollama_url)
    summarize(results, args.model, args.repeat)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"model": args.model, "backend": args.backend, "repeat": args.repeat, "results": results}, indent=2))
    print(f"\nFull run → {out}")


if __name__ == "__main__":
    main()

# lean: naive urllib POST, no retry/backoff; add if we hit rate limits.
# lean: median only, no stddev; add if variance matters.
