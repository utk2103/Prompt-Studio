---
name: lean-help
description: >
  Quick-reference card for all Lean modes, skills, and commands. One-shot
  display, not a persistent mode: shows the card and exits without switching
  levels, writing flag files, or persisting anything. Trigger: /lean-help,
  "lean help", "what lean commands", "how do I use lean", "lean cheatsheet",
  "lean reference".
license: Apache-2.0
---

# Lean Help

Display this reference card when invoked. **One-shot only** — do NOT change
mode, write flag files, touch `~/.claude/.lean-active`, or persist state of
any kind. If the user wants to switch modes, point them at the trigger.

---

## Levels at a glance

| Level | Trigger | Rule of thumb | Diff shape |
|-------|---------|---------------|-----------|
| **Lite** | `/prompt-studio:lean lite` | Build what's asked. Name the lazier alternative in one line. | Requested code + 1-line footnote. |
| **Full** | `/prompt-studio:lean` (default) | The ladder: YAGNI → reuse → stdlib → native → installed dep → one line → minimum. | Shortest working diff. ≤3 lines of prose. |
| **Ultra** | `/prompt-studio:lean ultra` | YAGNI extremist. Deletion beats addition. Challenges the requirement before building. | Often zero code + a question back. |

Level sticks until you change it or the session ends. Persisted in
`~/.claude/.lean-active` so it survives across turns.

### Same task, three levels

Task: *"Add a cache for these API responses."*

| Level | Response |
|-------|----------|
| Lite | Custom `TTLCache` class as asked. Note: `functools.lru_cache(maxsize=1000)` covers it in one line. |
| Full | `@lru_cache(maxsize=1000)` on the fetch function. Skipped custom cache, add when lru_cache measurably falls short. |
| Ultra | Do these responses actually re-fetch? Show me a hot path. If yes: `@lru_cache`. If not: skip. |

---

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **lean** | `/prompt-studio:lean [lite\|full\|ultra]` | Lazy mode itself. Shortest solution that actually works. |
| **compress** | `/prompt-studio:compress FILE` | Compress a memory file (CLAUDE.md, todos, prefs) into Lean shorthand. Backup at `FILE.original.md`. |
| **lean-audit** | `/prompt-studio:lean-audit` | Whole-repo over-engineering audit. Ranked list of what to delete/simplify across the codebase. |
| **lean-help** | `/prompt-studio:lean-help` | This card. |

Codex users: `@lean`, `@compress`, `@lean-audit`, `@lean-help`. OpenCode and Claude Code:
slash-command forms above.

---

## The ladder (full mode)

Stop at the first rung that holds:

1. **Needs to exist?** Speculative → skip, one-line note. (YAGNI)
2. **Already in this codebase?** Helper/util/type nearby → reuse.
3. **Stdlib does it?** Use it.
4. **Native platform feature?** `<input type="date">` over picker lib, CSS over JS, DB constraint over app code.
5. **Installed dep solves it?** Use it. Never add a new dep for what a few lines can do.
6. **One line?** One line.
7. **Only then:** minimum code that works.

---

## Deactivate / resume

| Action | Say |
|--------|-----|
| Turn off | `stop lean`, `normal mode`, or `/prompt-studio:lean off` |
| Resume | `/prompt-studio:lean` (or with a level) |
| Check current | `cat ~/.claude/.lean-active` |

---

## Configure default mode

Default is `full`, auto-active every session. Override:

**Environment variable** (highest priority):
```bash
export LEAN_DEFAULT_MODE=ultra   # lite | full | ultra | off
```

**Config file** — `~/.config/lean/config.json` (Windows: `%APPDATA%\lean\config.json`):
```json
{ "defaultMode": "lite" }
```

Set `"off"` to disable auto-activation on session start; activate manually
with `/prompt-studio:lean` when wanted.

Resolution order: env var → config file → `full`.

---

## MCP surface

The `lean-mcp` server exposes the same builder used by the FastAPI adapters
(`app/services/formats.build_messages`) and this plugin — one source of
truth in `app/services/skills.py`, no drift between transports. Wire it into
any MCP-compatible client to get Lean shaping without the plugin.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Mode reverts every turn | `~/.claude/.lean-active` not writable — check perms. |
| `/lean-help` prints nothing | Skill not loaded. Reinstall (see Update). |
| Default mode ignored | Env var wins over config file — `unset LEAN_DEFAULT_MODE`. |
| Want Lean only in one repo | Add project-level hook, not global env var. |
| Conflicts with `caveman` prose mode | Fine — Lean shapes code, caveman shapes prose. Run both. |

---

## Update

```
/plugin marketplace update prompt-studio
/plugin install lean@prompt-studio
```

Or turn on auto-update in `/plugin` → Marketplaces. Codex and OpenCode use
their own reinstall flow from the repo.

---

## More

Full docs, examples, and source: https://github.com/utk2103/Prompt-Studio
