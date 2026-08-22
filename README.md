<div align= "center">
<p align="center">
  <img width="180" height="180" src="public/prompt-studio-logo.svg" alt="Prompt Studio logo" style="margin-right:20px;">
</p>
<h1>Prompt Studio</h1>
<br>

AI-powered prompt engineering workbench — analyze, score, optimize, and store prompts with a terminal-style UI and a FastAPI backend backed by PostgreSQL + pgvector.

<div>
  <img src="https://badgen.net/badge/status/Under%20Development/red?icon=lgtm" alt="status">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="version">
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="license">
  <img src="https://img.shields.io/github/commit-activity/m/utk2103/Prompt-Studio" alt="commits">
  <img src="https://img.shields.io/github/repo-size/utk2103/Prompt-Studio" alt="repo size">
  <img src="https://img.shields.io/badge/code%20style-ruff-000000.svg" alt="code style">
</div>

</div>
  
## Overview

Prompt Studio gives you a structured workflow for writing better prompts:

- **Analyze** — paste a prompt and get instant feedback on structure, clarity, and completeness
- **Score** — 7-dimension quality breakdown with a letter grade
- **Optimize** — rule-based improvement pass that adds missing persona, format, example, and constraint directives
- **Compress** — strip filler tokens without losing semantic content
- **Token counter** — estimate input/output tokens and per-call USD cost across 7 models
- **Context map** — see how your prompt fits across every supported model's context window
- **Model compatibility** — cross-model evaluation matrix with format adaptation notes
- **Adaptive wizard** — 7-question guided flow that auto-generates a well-structured prompt
- **History** — persistent session history backed by PostgreSQL; semantic search via pgvector
- **Lean persona layer** — ponytail-style prompt injection: one `SKILL.md`, mode-filtered (`lite`/`full`/`ultra`), served through per-provider adapters with Anthropic prompt-cache markers
- **`lean-mcp`** — MCP stdio server exposing the same ruleset as a prompt + tool for MCP hosts
- **Benchmarks** — Python harness comparing `baseline` / `caveman` / `lean-{lite,full,ultra}` arms across LOC, tokens, cost, latency


## Quickstart

### Local (no Docker)

**Backend**
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# UI → http://localhost:3000
```

> The frontend works fully offline — all scoring, issue detection, and wizard generation fall back to local TypeScript implementations when the API is unreachable.

### Docker (full stack)

```bash
# Start PostgreSQL (pgvector), API, and Next.js frontend
docker compose -f docker-ignore.yml up --build

# API    → http://localhost:8000
# UI     → http://localhost:3000
# DB     → localhost:5432
```

Migrations run automatically on API container startup (`alembic upgrade head`). Manual migration commands live in [CONTRIBUTING.md](CONTRIBUTING.md#database-migrations).

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/models` | List all supported models with metadata |
| `POST` | `/analyze` | Full pipeline: score + issues + token count + format preview |
| `POST` | `/score` | 7-dimension scoring + top-3 recommendations |
| `POST` | `/tokens/count` | Token count, context window %, and per-call USD cost |
| `POST` | `/validate/format` | Issue detection + model-native format preview |
| `POST` | `/optimize` | Rule-based prompt improvement pass |
| `POST` | `/compare/models` | Cross-model compatibility matrix |
| `GET` | `/wizard/questions` | Adaptive wizard question set |
| `POST` | `/wizard/generate` | Build a prompt from collected wizard answers |
| `POST` | `/prompt/compress` | Filler-token compression pass |
| `GET` | `/history` | Fetch persisted session history |
| `POST` | `/history` | Save a history entry |
| `DELETE` | `/history` | Clear all history |
| `GET` | `/health` | Health check |

## Scoring Dimensions

Each prompt is evaluated across 7 dimensions (0–100), producing an overall score and a letter grade (A–F):

| Dimension | What it measures |
|-----------|-----------------|
| Clarity | Sentence structure, optimal word count (~40–80 words ideal) |
| Specificity | Presence of clear action verbs |
| Context richness | Role definition, background, few-shot examples |
| Format spec | Explicit output format (JSON, markdown, bullet list, etc.) |
| Mode alignment | Vocabulary match for TECHNICAL / CREATIVE / SYSTEM mode |
| Token efficiency | Length relative to task complexity |
| Constraints | Boundaries, guardrails, and scope limiters |

## Prompt Modes

| Mode | Best for |
|------|---------|
| `TECHNICAL` | Code generation, debugging, system design, analysis |
| `CREATIVE` | Narratives, copywriting, ideation, fiction |
| `SYSTEM` | Assistant personas, instruction sets, chatbot rules |

## Supported Models

| Model | Provider | Context | Format |
|-------|----------|---------|--------|
| GPT-4o | OpenAI | 128K | ChatML |
| Claude 3.5 Sonnet | Anthropic | 200K | XML Tags |
| Gemini 1.5 Pro | Google | 1M | Gemini Native |
| GPT-3.5 Turbo | OpenAI | 16K | ChatML |
| Llama 3.1 70B | Meta | 128K | Llama Template |
| Mistral Large | Mistral AI | 32K | Mistral Native |
| DeepSeek-V3 | DeepSeek | 64K | ChatML |

## Lean Persona Layer

Prompt-Studio ships a ponytail-inspired **Lean** persona (`skills/lean/SKILL.md`) that reduces LLM output size, cost, and latency. One source of truth, filtered per intensity by `app/services/skills.py::get_lean_instructions(mode)` and injected in the system slot by per-provider adapters in `app/services/formats.py`.

```python
from app.services.formats import build_messages

msgs = build_messages(
    text="Write a Python function that validates emails.",
    model_id="claude-3-5",
    intensity="full",   # "lite" | "full" | "ultra"
)
# msgs[0] → system slot with LEAN persona + cache_control: ephemeral
# msgs[1] → user turn
```

| Intensity | When to use |
|-----------|-------------|
| `lite`    | Minimum payload — small models, tight context, cost-sensitive calls |
| `full`    | Default — production balance of guidance and payload |
| `ultra`   | Maximum guidance — long agentic sessions with over-build risk |

The system slot is marked `cache_control: ephemeral` so the persona charges once per Anthropic prompt-cache TTL, not per turn. If `SKILL.md` cannot be read, a hardcoded fallback ships instead — the layer never fails silent.

## lean-mcp

Standalone MCP stdio server (`lean-mcp/`) that serves the same Lean ruleset for MCP hosts whose only injection point is the prompt menu.

```bash
cd lean-mcp && pip install -e .
python server.py
```

Client config:
```json
{ "mcpServers": { "lean": { "command": "python", "args": ["lean-mcp/server.py"] } } }
```

Exposes prompt `lean` and tool `lean_instructions`, both accepting `mode`. Zero drift with the FastAPI adapters — both call `get_lean_instructions()`.

## Benchmarks

`benchmarks/` measures the Lean persona's impact on LOC / tokens / cost / latency across five arms: `baseline`, `caveman`, `lean-lite`, `lean-full`, `lean-ultra`.

```bash
# Local, no API key
python benchmarks/benchmark.py --backend ollama --model llama3.2 --repeat 3

# Anthropic
ANTHROPIC_API_KEY=sk-ant-... python benchmarks/benchmark.py \
    --backend anthropic --model claude-haiku-4-5-20251001 --repeat 5
```

Includes the standard five tasks (email, debounce, csv-sum, countdown, rate-limit) plus two Prompt-Studio-specific tasks that exercise the per-provider adapters (`chatml2xml`, `cost-est`). Agentic sub-harness (`benchmarks/agentic/`) runs the arms as full Claude Code sessions against a real repo.

## Statusline (optional)

Show the active Lean level in your Claude Code statusline. A plugin can't self-register a statusline, so point `~/.claude/settings.json` at the script:

```json
{ "statusLine": { "type": "command", "command": "bash /ABS/PATH/hooks/lean-statusline.sh" } }
```

Windows: `pwsh -File C:\ABS\PATH\hooks\lean-statusline.ps1`. It prints `[LEAN]` for full, `[LEAN:LEVEL]` otherwise (amber for `ultra`), and stays silent when Lean is off. It reads the same project-scoped `.lean-active` flag the hooks write.

## Install as an Agent Plugin

Prompt-Studio ships adapters for the major agent hosts. Each one injects the Lean persona from the same `skills/lean/SKILL.md` — one source of truth, zero drift across hosts.

The Python hooks (`hooks/lean_*.py`) run on `SessionStart`, `SubagentStart`, and `UserPromptSubmit`, so `python3` needs to be on `PATH`. Nix/nvm users: it must be on the non-interactive shell's PATH too.

### Claude Code

```
/plugin marketplace add utk2103/Prompt-Studio
/plugin install prompt-studio@prompt-studio
```

Two separate prompts. Start a new session; the ruleset lands in system context on `SessionStart`.

Local clone:
```
/plugin marketplace add /path/to/Prompt-Studio
/plugin install prompt-studio@prompt-studio
```

### Codex

```bash
codex plugin marketplace add utk2103/Prompt-Studio
codex plugin add prompt-studio@prompt-studio
```

Run `codex`, open `/hooks`, trust the two lifecycle hooks, start a new thread. Same install covers the Codex desktop app after restart.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add utk2103/Prompt-Studio
copilot plugin install prompt-studio@prompt-studio
```

Or the slash equivalents inside an interactive Copilot session:
```
/plugin marketplace add utk2103/Prompt-Studio
/plugin install prompt-studio@prompt-studio
```

Copilot CLI namespaces plugin commands: `/prompt-studio:lean ultra`, `/prompt-studio:compress <path>`.

### Devin CLI

```bash
devin plugins install utk2103/Prompt-Studio
```

Skills expose as `/prompt-studio:lean`, `/prompt-studio:compress`, etc.

### Qoder

```bash
# per-project
cp -r .qoder /path/to/your-project/
```

Qoder auto-loads `AGENTS.md` and `.qoder/rules/*.md` as always-on context. For full plugin-tier support (auto mode activation + ruleset injection on every prompt), add the hooks from `hooks/qoder-hooks.json` to your `.qoder/settings.json` and set `PROMPT_STUDIO_DIR` to the checkout path.

### Cursor / Windsurf / Cline / Aider / Kiro / Zed (instruction-only)

Copy the rules file into the target host's rules directory:

```bash
cp .cursor/rules/*.mdc /path/to/project/.cursor/rules/       # Cursor
```

For Windsurf / Cline / Kiro, drop `skills/lean/SKILL.md` at:
- Windsurf: `.windsurf/rules/lean.md`
- Cline: `.clinerules/lean.md`
- Kiro: `.kiro/steering/lean.md` (or `~/.kiro/steering/` global)

These paths keep always-on guidance; they don't add mode switches or hooks.

### JetBrains / VS Code Copilot Chat / Amp / Jules / CodeWhale / Antigravity

All read `AGENTS.md` from the repo root. Running from a Prompt-Studio checkout works with no setup. For a global install, drop the file at `~/.copilot/copilot-instructions.md` (Copilot Chat) or the equivalent home path per host.

### Slash commands (all hosts that support skills)

| Command                          | Effect |
|----------------------------------|--------|
| `/prompt-studio:lean lite`       | Minimum-payload intensity |
| `/prompt-studio:lean full`       | Default intensity |
| `/prompt-studio:lean ultra`      | Maximum guidance |
| `/prompt-studio:lean off` or `stop lean` | Deactivate for the session |
| `/prompt-studio:lean-help`       | Quick reference, one-shot, no state change |
| `/prompt-studio:lean-stats`      | Real token usage + estimated savings for the current session |
| `/prompt-studio:compress <file>` | Compress a memory file (CLAUDE.md, todos, prefs) into lean format |

Short form (`/lean lite`, `stop lean`) also works — the `UserPromptSubmit` hook parses the raw prompt even when the slash-command menu doesn't recognize the un-namespaced form.

Mode persists in `~/.claude/.lean-active` across turns. Subagents spawned via `Task` inherit the ruleset through the `SubagentStart` hook — no drift.

### Troubleshooting

- `/lean` shows "command not found" → use `/prompt-studio:lean`; the short form works if you submit it as a plain message.
- Hooks don't fire → confirm `python3` is on `PATH` (`which python3`).
- Nothing in system context after `SessionStart` → run `python3 hooks/lean_activate.py` from the plugin dir; if it prints the ruleset, the manifest is wired correctly and the issue is at the host's hook layer.

### Uninstall

| Host | Command |
|------|---------|
| Claude Code  | `/plugin remove prompt-studio` |
| Codex        | `codex plugin remove prompt-studio` |
| Devin CLI    | `devin plugins remove prompt-studio` |
| Copilot CLI  | `copilot plugin uninstall prompt-studio` |
| Cursor / Windsurf / Cline / Qoder / Kiro | Delete the copied rule file |

Then `rm -f ~/.claude/.lean-active` to clear the mode flag.

## Versioning

SemVer 2.0.0 across the monorepo. All seven version-carrying files ship in lockstep — the API, frontend, Claude Code plugin, Codex adapter, Devin adapter, Qoder adapter, and MCP server all share one version.

```bash
pdm run check_versions   # verifies alignment
```

Bump workflow: edit all seven files, `git tag vX.Y.Z`, push. See `scripts/check_versions.py`.

## Database Schema

Two tables, managed by Alembic:

**`prompts`** — full prompt records with vector embeddings
- Stores prompt text, mode, model, all 7 score dimensions, issues JSON, recommendations JSON
- `embedding` column — `vector(1536)`, populated when an embedding model is wired in
- `ivfflat` cosine index for approximate nearest-neighbour semantic search

**`history`** — lightweight session entries
- Preview text, mode, model, overall score
- FK to `prompts.id` for drill-down

Embedding dimension defaults to `1536` (OpenAI `text-embedding-3-small`). Change `EMBEDDING_DIM` in `app/db/models.py` and generate a new migration to use a different model (e.g. `384` for `all-MiniLM-L6-v2`).

## Environment Variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://promptstudio:promptstudio@localhost:5432/promptstudio
```

## FAQ

**Can I use it with [caveman](https://github.com/JuliusBrussee/caveman)?**
Yes. Caveman compresses what the agent *says*; Lean shrinks what it *builds*. No overlap — Lean stays out of your prose, Caveman leaves code byte-for-byte exact.

**Does it need a config file?**
No. `~/.claude/.lean-active` is written by the hook itself; nothing else is required.

**Which hosts support the mode switch?**
Any host with `SessionStart` + `UserPromptSubmit` hook events: Claude Code, Codex, Copilot CLI. Cursor / Windsurf / Cline / Kiro get the always-on ruleset but not the runtime mode knob.

**Where does the persona actually live?**
`skills/lean/SKILL.md`. Everything else — plugin, MCP, benchmark arms, FastAPI adapters — reads from that one file via `app/services/skills.py::get_lean_instructions()`.

**How do I bump the version?**
`pdm run check_versions` first to confirm alignment, edit all seven files (three JSON adapter manifests, three TOML/JSON project files, one frontend `package.json`), tag `vX.Y.Z`.

## Lean Plugin Deep Dive

How the Lean plugin actually activates, where it stores state, and known bugs.

### Activation flow (Claude Code / Codex host)

Plugin manifest: `hooks/claude-codex-hooks.json`. Three hook events wired:

| Event | Script | Purpose |
|-------|--------|---------|
| `SessionStart` (matcher `startup\|resume\|clear\|compact`) | `hooks/lean_activate.py` | Read mode flag, write it back (persists default on first run), inject ruleset into system context via stdout. |
| `UserPromptSubmit` | `hooks/lean_mode_tracker.py` | Parse `/lean lite\|full\|ultra\|off` from the prompt or its `<command-name>`/`<command-args>` envelope. Rewrites the flag and re-injects the new ruleset for the current turn. |
| `SubagentStart` | `hooks/lean_subagent.py` | Re-inject the ruleset into `Task`-spawned subagents (parent system context does not propagate). |

Ruleset text comes from a single source: `skills/lean/SKILL.md`, filtered per-mode by `app/services/skills.py::get_lean_instructions(mode)`. The plugin, the `lean-mcp` server, and the FastAPI adapters (`app/services/formats.build_messages`) all call the same builder — zero drift.

Mode lifecycle for a single prompt:

```
user types "/lean ultra"
        ↓
Claude Code fires UserPromptSubmit hook with JSON on stdin
        ↓
lean_mode_tracker.py:
  read_stdin_json() → {"prompt": "<command-name>/lean</command-name>..."}
  _unwrap() reconstructs "/lean ultra"
  _CMD regex matches → arg = "ultra"
  write_mode("ultra")          # persists to state file
  emit_prompt_submit(
     systemMessage="LEAN MODE → ultra",
     additionalContext=get_lean_instructions("ultra")
  )
        ↓
Claude Code merges additionalContext into this turn's system context
```

Next session, `SessionStart` reads the same flag and re-emits the ruleset — no manual reactivation required *in the ideal case*.

### State / "history" storage

There is no session history log. The plugin persists **only** the current mode as a single flag file.

Path (from `hooks/_lean_common.py`):

```
{CLAUDE_STATE_DIR | CLAUDE_CONFIG_DIR | ~/.claude}/.lean-active-<sha1(project)[:8]>
```

Where `<project>` is the first non-empty of `CLAUDE_PROJECT_DIR`, then `PWD`. If neither is set, the suffix is omitted and the flag becomes global (`~/.claude/.lean-active`). This per-project scoping (`ponytail #662`) exists so concurrent sessions in different repos do not clobber each other's mode.

File contents: literal string, one of `lite`, `full`, `ultra`, `off`. Max 64 bytes. Written atomically (`O_CREAT|O_EXCL` temp + `os.replace`) with mode `0600`. Reader refuses symlinks and oversize files (silent fall through to default). Default when the flag is missing or invalid: value of `LEAN_DEFAULT_MODE` env var if valid, otherwise `full`.

"Off" is stored as the literal string `off` rather than deleting the flag — so `stop lean` persists across new sessions (`#488`). To fully reset: `rm -f ~/.claude/.lean-active*`.

Conversation history, previous prompts, or per-turn diffs are **not** recorded anywhere by this plugin. If you want that, it does not currently exist.

### Bug 1 — token savings display (FIXED)

**Was**: no `/lean-stats` command, no skill, no wired hook. `hooks/lean_usage_probe.py` was a self-labeled TEMP probe never registered in `claude-codex-hooks.json`.

**Fix**: `hooks/lean_stats.py` reads the current session's JSONL transcript (from `session_id`/`transcript_path` in the hook payload, or the most-recent file under `~/.claude/projects/<slug>/`) and aggregates `message.usage.{input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens}`. `lean_mode_tracker.py` recognises `/lean-stats` (raw or via `<command-name>` envelope) and emits the formatted stats as a `systemMessage`. `commands/lean-stats.toml` registers the slash command. Estimated savings use the Lean-vs-baseline output-token median from `benchmarks/` (~65%) — shown as an estimate, not a per-session measurement.

Example output:

```
LEAN STATS (full) — session 088f0104
  Turns:              143
  Input tokens:       4,977
  Cache read:         13,818,871
  Cache creation:     1,013,683
  Output tokens:      458,928
  Est. output saved:  ~852,295 (baseline ~1,311,223, benchmark median 65%)
```

Trigger with `/lean-stats` or `/prompt-studio:lean-stats`. Self-check: `python3 hooks/lean_stats.py`.

### Bug 2 — reactivation required after logout/login (FIXED)

**Was**: two contributing causes.

1. **Non-stable project key.** `_project_scope()` hashed the raw `CLAUDE_PROJECT_DIR`/`PWD`. Symlinks, trailing slashes, and Finder-vs-terminal launches all produced different hashes for the same repo, so the flag lookup missed and fell back to default `full`.
2. **Write-back of the default.** `lean_activate.py` called `write_mode(read_mode())` unconditionally on `SessionStart`. When the read fell back to default `full` because of reason (1), that default got persisted under the new drifted hash key — orphaning the user's real `ultra` under the old key.

(Host-level plugin state loss on account switch is a Claude Code UX issue and outside this repo's scope. Recovery there is `/plugin marketplace add ...` + `/plugin install ...` again.)

**Fix**:

- `hooks/_lean_common.py::_project_scope()` now normalizes via `os.path.realpath()` and strips trailing separators before hashing. All three of `/repo`, `/repo/`, and `/symlink-to-repo` collapse to one key.
- `hooks/_lean_common.py::read_mode()` now checks the project-scoped flag first, then falls through to the global `~/.claude/.lean-active`. Any pre-normalization or ambiguous-cwd preference is still honoured.
- `hooks/_lean_common.py::has_persisted_mode()` (new) reports whether either flag file actually exists on disk.
- `hooks/lean_activate.py` now only calls `write_mode()` when `has_persisted_mode()` is true. On a fresh launch nothing is written — the ruleset is still injected, but the default no longer pins a drifted key.

Long-term follow-up: a committable `.lean.toml` in the project root would survive host-level state loss entirely. Not built yet — YAGNI unless the host-state problem recurs after these fixes.

### Diagnostics

Quick checks to run when Lean seems inactive:

```bash
# Is the flag file present and what does it contain?
ls -la ~/.claude/.lean-active*
cat ~/.claude/.lean-active* 2>/dev/null

# Does the SessionStart hook produce output when run directly?
python3 hooks/lean_activate.py

# Simulate a /lean ultra prompt through the tracker.
echo '{"prompt": "/lean ultra"}' | python3 hooks/lean_mode_tracker.py

# What project hash is the current shell computing?
python3 -c "import hashlib, os; p=os.environ.get('CLAUDE_PROJECT_DIR') or os.environ.get('PWD'); print(hashlib.sha1(p.encode()).hexdigest()[:8], p)"
```

If `lean_activate.py` prints the full ruleset, the plugin code is fine — the issue is at the host's hook wiring or plugin registration.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License — see [LICENSE](LICENSE).
