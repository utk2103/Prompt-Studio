---
description: Switch Lean intensity (lite | full | ultra | off).
argument-hint: "[lite|full|ultra|off]"
---

Set or query the Lean persona intensity. The mode-tracker hook parses this and
mutates the state flag; the ruleset is re-injected on the next SessionStart.

Examples:
- `/lean lite`  — minimum payload
- `/lean full`  — default
- `/lean ultra` — max guidance
- `/lean off`   — deactivate
