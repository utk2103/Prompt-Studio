---
name: lean-gain
description: >
  Show Lean's measured impact as a compact scoreboard: less code, more speed,
  from the benchmark medians. One-shot display, not a persistent mode, and not
  a per-repo number. Trigger: /lean-gain, "lean gain", "what does lean save",
  "show lean impact", "lean scoreboard".
license: Apache-2.0
---

# Lean Gain

Display this scoreboard when invoked. One-shot: do NOT change mode, write flag
files, or persist anything.

The figures are Prompt-Studio's own benchmark medians, measured — not computed
from the current repo. Source: `benchmarks/results/latest.json` and
`benchmarks/results/2026-08-12-lean-vs-ponytail.md`.

## Scoreboard

Render plain ASCII bars. The bar length shows the measured range; the label
carries the exact figure:

```
  lean gain                          measured · gpt-4o-mini · n=3 · 7 tasks

  Lines of code   baseline  ████████████████████  100%
                  lean      ██████··············   25–35%   ▼ 65–75%
  Speed           lean      ▸ ~4× faster  (3.5–4.3×, full = 4.25×)

  Cost            not shown by design — see Honesty boundary.

  This repo:  /prompt-studio:lean-stats   (real tokens, this session)
              /prompt-studio:lean-debt    (counted shortcut ledger)
              /prompt-studio:lean-audit   (what's still cuttable)
```

## Honesty boundary

These are benchmark medians, not this repo. NEVER print a per-repo savings
number ("you saved X lines/tokens here"): the unbuilt version was never
written, so there is no real baseline to subtract from in a live repo.

No cost bar is shown **by design, not omission**: on single-shot tasks Lean's
cost is roughly flat (~100–108% of baseline in `latest.json`) because the Lean
system-prompt input tokens offset the output-token savings. Claiming a cost win
would contradict the measured data. For real per-session cost use
`/prompt-studio:lean-stats` (actual token counts) and `/prompt-studio:lean-debt`
(counted ledger); for what's still cuttable, `/prompt-studio:lean-audit`.

Basis is a single model (gpt-4o-mini, n=3) — the footer says so. Do not present
it as multi-model.

## Boundaries

One-shot display. Edits nothing, changes no mode.
"stop lean" or "normal mode": revert.
