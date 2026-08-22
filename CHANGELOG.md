# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions are kept in lockstep across the seven manifests listed in
`scripts/check_versions.py` — every release bumps all of them together.

## [Unreleased]

### Added
- `/lean-debt` (`/prompt-studio:lean-debt`) — harvest `lean:` comments into a
  read-only debt ledger; markers with no upgrade path get a `no-trigger` tag.
  `skills/lean-debt/SKILL.md`, `commands/lean-debt.toml`.
- `/lean-review` (`/prompt-studio:lean-review`) — diff review for
  over-engineering only (delete/stdlib/native/yagni/shrink), ends `net: -N lines`.
  `skills/lean-review/SKILL.md`, `commands/lean-review.toml`.
- `/lean-audit` (`/prompt-studio:lean-audit`) — whole-repo lean-review, ranked
  biggest-cut-first with net lines + deps. `skills/lean-audit/SKILL.md`,
  `commands/lean-audit.toml`.
- `/lean-gain` (`/prompt-studio:lean-gain`) — measured impact scoreboard
  (LOC ▼65–75%, ~4× speed; no cost bar by design, cost is flat single-shot).
  `skills/lean-gain/SKILL.md`, `commands/lean-gain.toml`.
- Lean statusline — `hooks/lean-statusline.sh` + `hooks/lean-statusline.ps1`,
  opt-in via `statusLine.command`. Prints `[LEAN]`/`[LEAN:LEVEL]` (amber for
  ultra), reads the project-scoped `.lean-active` flag.
- Copilot and Qoder hook adapters — `hooks/copilot-hooks.json`,
  `hooks/qoder-hooks.json`; call the Python hooks via the python3→python fallback.
- Editor / marketplace surfaces — `.agents/rules/lean.md`,
  `.agents/plugins/marketplace.json`, `.windsurf/rules/lean.md`,
  `gemini-extension.json`.
- Lean page (`frontend/app/lean/page.tsx`) — Commands section listing the eight
  slash commands; refreshed host/integration list.

## [1.1.0] - 2026-08-21

### Added
- `/lean-stats` (and `/prompt-studio:lean-stats`) — real per-session token usage
  aggregated from the Claude Code JSONL transcript, with an estimated output-token
  savings figure derived from the benchmark median (~65%). New files:
  `hooks/lean_stats.py`, `commands/lean-stats.toml`.
- `hooks/_lean_common.py::has_persisted_mode()` — reports whether a Lean mode
  flag actually exists on disk (project-scoped or global).
- `hooks/_lean_common.py::_GLOBAL_STATE_FILE` — un-scoped `~/.claude/.lean-active`
  used as a fallback when the project-scoped flag is missing.
- CHANGELOG.md.

### Fixed
- Lean mode no longer resets to `full` after re-login or when the project path
  changes shape (trailing slash, symlink, Finder-vs-terminal launch).
  `_project_scope()` now normalizes via `os.path.realpath()` + trailing-separator
  strip before hashing, and `read_mode()` falls through to the global flag so
  preferences saved under the old key are still honoured.
- `hooks/lean_activate.py` no longer writes the default mode back on a fresh
  launch. The previous behaviour orphaned a real `ultra` selection under a
  drifted-key `full` write.

### Changed
- Widened the `lean_mode_tracker.py` envelope regex (`_LEAN_SLASH`) to accept
  `lean-stats` alongside `lean`, so slash-command envelopes for the new command
  are routed to the tracker instead of being dropped.
- README.md — added "Lean Plugin Deep Dive" section covering activation flow,
  state storage, and the fixed bugs; added `/lean-stats` to the command table.

### Tests
- `tests/unit/test_plugin_hooks.py` — replaced the "activate writes default on
  fresh state" assertion with three tests covering the new contract:
  fresh state emits ruleset but writes nothing, existing `ultra` flag survives
  activation byte-for-byte, and the global-flag fallback path is honoured.
- Added coverage for `/lean-stats` (fabricated transcript → correct aggregated
  turn count and output token total in the emitted `systemMessage`).

## [1.0.0] - 2026-08-20

Initial tagged release. Prompt Studio at feature parity: FastAPI backend
(analyze / score / optimize / compress / tokens / history), Next.js frontend,
Lean persona layer with per-provider adapters and `SKILL.md` single source of
truth, `lean-mcp` stdio server, benchmarks harness, and plugin adapters for
Claude Code, Codex, Devin, Copilot CLI, Qoder, Cursor, Windsurf, Cline, Kiro,
and Zed.

[Unreleased]: https://github.com/utk2103/Prompt-Studio/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/utk2103/Prompt-Studio/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/utk2103/Prompt-Studio/releases/tag/v1.0.0
