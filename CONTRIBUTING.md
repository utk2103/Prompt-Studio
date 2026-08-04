# Contributing to Prompt Studio

Thanks for considering a contribution. Prompt Studio is a FastAPI + Next.js
prompt-engineering workbench with a Lean persona layer, an MCP server, a
Claude Code plugin, and a benchmark harness. Most contributions fall into
one of these buckets:

1. **Backend / API** — FastAPI routes, scoring, optimizer, wizard, token/cost math.
2. **Frontend** — Next.js App Router UI, terminal-style workbench.
3. **Lean persona** — the `SKILL.md` ruleset, per-provider adapters, MCP server, Claude Code plugin.
4. **Benchmarks / evals** — measure Lean's impact on LOC / tokens / cost / latency.
5. **Docs, hooks, installer glue** — README, plugin manifest, session hooks.

Small focused PR > big rewrite. One concern per PR.

## Quick Links

- **GitHub:** https://github.com/utk2103/Prompt-Studio
- **X/Twitter:** [@utk2103](https://x.com/utk2103)

## Maintainers

- **Utkarsh Upadhyay** — Core, API, Frontend, Prompt Engine
  - GitHub: [@utk2103](https://github.com/utk2103) · X: [@utk2103](https://x.com/utk2103)

---

## How to contribute

1. **Bugs & small fixes** → open a PR.
2. **New features / architecture** → open a [GitHub Issue](https://github.com/utk2103/Prompt-Studio/issues/new/choose) first. Large features get discussed before implementation.
3. **Refactor-only PRs** → don't open one. Not accepted unless a maintainer requests it as part of a concrete fix.
4. **Test/CI-only PRs for known `main` failures** → don't open one. Known failures are already tracked; PRs that only tweak tests to chase them get closed.
5. **Questions** → open a GitHub Issue with the `question` label.

## PR limits

Cap at **10 open PRs per author**. Exceed it → `r: too-many-prs` label and auto-close.

---

## Quick orientation

The repo ships:

- FastAPI backend under `app/` (routes, services, schemas, db).
- Next.js frontend under `frontend/`.
- One Lean skill at `skills/lean/SKILL.md`, filtered by intensity (`lite`/`full`/`ultra`) and injected via per-provider adapters in `app/services/formats.py`.
- Standalone MCP stdio server at `lean-mcp/` that serves the same ruleset.
- Claude Code plugin at `.claude-plugin/` with hooks under `hooks/`.
- Benchmark harness under `benchmarks/` (plus `benchmarks/agentic/` for full-session runs).

Sources of truth live at their canonical path. Do **not** duplicate the Lean
ruleset — the MCP server and the FastAPI adapters both call
`app.services.skills.get_lean_instructions()` so there's zero drift.

---

## What to edit (sources of truth)

| I want to change... | Edit this file |
|---|---|
| Lean persona behavior (intensity levels, voice, rules) | `skills/lean/SKILL.md` |
| Intensity filter / fallback / caching | `app/services/skills.py` |
| Per-provider system-slot injection (Anthropic/OpenAI/etc.) | `app/services/formats.py` |
| Scoring dimensions | `app/services/scoring.py` |
| Optimizer rules | `app/services/optimize.py` |
| Compression pass | `app/services/compress.py` |
| Wizard question flow | `app/services/wizard.py` |
| Token / cost math + model registry | `app/services/tokens.py`, `app/services/models_registry.py` |
| API surface (routes) | `app/routes/` |
| Request/response schemas | `app/schemas/` |
| DB models | `app/db/` + Alembic migrations under `alembic/` |
| MCP server | `lean-mcp/server.py`, `lean-mcp/instructions.py` |
| Claude Code plugin manifest | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| Session hooks (Lean activation, mode tracking, subagent inject) | `hooks/lean_activate.py`, `hooks/lean_mode_tracker.py`, `hooks/lean_subagent.py`, `hooks/_lean_common.py` |
| Hook wiring | `hooks/claude-codex-hooks.json` |
| Slash commands | `commands/lean.toml`, `commands/lean-help.toml` |
| Benchmark arms / tasks | `benchmarks/arms/`, `benchmarks/benchmark.py` |
| Version check | `scripts/check_versions.py` |
| Frontend UI | `frontend/app/`, `frontend/components/` |

When in doubt: if a file mirrors ruleset text that lives under `skills/lean/`,
edit the source and let the adapters read it — don't fork the text.

---

## Adding a new model

Model metadata is centralized. To add a model:

1. Add the entry to `app/services/models_registry.py` with provider, context window, pricing, and format.
2. If the provider needs a new adapter branch (system slot, cache marker), extend `app/services/formats.py::build_messages`.
3. Add or update the row in the "Supported Models" table in `README.md`.
4. Add a token-count test under `tests/unit/` if the tokenizer differs from an existing family.

## Adding a new scoring dimension

1. Extend the dimension list in `app/services/scoring.py` and the schema in `app/schemas/`.
2. Update the Alembic model + generate a migration if it needs to persist.
3. Update the "Scoring Dimensions" table in `README.md`.
4. Add a unit test with a prompt that isolates the dimension.

---

## Local development

**Backend**
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend && npm install && npm run dev
```

**Full stack via Docker**
```bash
docker compose -f docker-ignore.yml up --build
```

### Database migrations

Alembic runs automatically on API container startup (`alembic upgrade head`).
Manual commands:

```bash
# Apply all pending migrations
pdm run migrate

# Auto-generate a new migration from model changes
pdm run make_migration "describe your change"

# Roll back one step
pdm run rollback
```

The `embedding` column defaults to `vector(1536)` (OpenAI
`text-embedding-3-small`). To use a different embedding model, change
`EMBEDDING_DIM` in `app/db/models.py` and generate a new migration.

### Environment

Create `.env` at the project root:

```env
DATABASE_URL=postgresql://promptstudio:promptstudio@localhost:5432/promptstudio
```

---

## Running tests

```bash
# Unit + integration
pytest

# Lean MCP server tests
pytest lean-mcp/test

# Benchmark arm sanity check
python -m benchmarks.test_arms
```

Any test that depends on a live API key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
Ollama, etc.) must skip cleanly when the dependency is missing. Never gate
the whole suite on optional creds.

## Running benchmarks

```bash
# Local, no API key
python benchmarks/benchmark.py --backend ollama --model llama3.2 --repeat 3

# Anthropic
ANTHROPIC_API_KEY=sk-ant-... python benchmarks/benchmark.py \
    --backend anthropic --model claude-haiku-4-5-20251001 --repeat 5
```

Numbers in `README.md` come from real runs — never invent or round. Update
`benchmarks/results/` when you re-run.

---

## Before you PR

- Test locally: start the API with `uvicorn app.main:app --reload --port 8000` and verify the frontend.
- Run `pip install -r requirements.txt` and confirm no import errors.
- Run `python scripts/check_versions.py` — versions across `pyproject.toml`, `.claude-plugin/plugin.json`, and README must stay in sync.
- Keep PRs focused — one concern per PR; don't mix unrelated changes.
- Describe what changed and **why**.
- Use American English spelling in code, comments, docs, and UI strings.
- **Include screenshots** for any UI or visual change (before/after).
- Ensure CI checks pass.

## Review conversations are author-owned

If a review bot leaves conversations on your PR:

- Resolve them yourself once addressed.
- Reply and leave open only when you need maintainer judgment.
- Don't leave bot review cleanup for maintainers.

---

## Code style

Invariants that have bitten us before. Keep them.

- **Hooks must silent-fail on filesystem errors.** A `try/except` that swallows the error is correct here. A hook that throws blocks Claude Code session start — user-facing breakage. See `hooks/lean_activate.py`.
- **Never duplicate the Lean ruleset.** Both the MCP server and the FastAPI adapters call `get_lean_instructions()`. A hardcoded fallback in `app/services/skills.py` is the only permitted second copy — it exists so the layer never fails silent when `SKILL.md` can't be read.
- **Anthropic system slot must stay `cache_control: ephemeral`.** Removing it re-charges the persona on every turn.
- **Validate only at boundaries.** Routes validate via Pydantic schemas; services trust their inputs. Don't sprinkle re-validation through the service layer.
- **Alembic migrations are append-only.** Never edit a merged migration — write a new one.
- **Don't hardcode `~/.claude` in hooks.** Honor `CLAUDE_CONFIG_DIR`.

---

## Tech stack

- **Backend:** FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy, Alembic, pgvector.
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, TypeScript.
- **Plugin/MCP:** Python stdio server, Claude Code hook API.

---

## AI / vibe-coded PRs welcome

Built with Codex, Claude, or another AI tool? Mark it.

Include in your PR:

- [ ] Mark as AI-assisted in the PR title or description.
- [ ] Note the degree of testing (untested / lightly tested / fully tested).
- [ ] Include prompts or session logs if possible.
- [ ] Confirm you understand what the code does.
- [ ] Resolve or reply to bot review conversations after you address them.

AI PRs are first-class citizens. Transparency helps reviewers know what to look for.

---

## Current focus

- **Prompt scoring accuracy** — improving the 7-dimension analysis engine.
- **Model coverage** — adding newer models and updated pricing.
- **Wizard UX** — smarter question flows and generated-prompt quality.
- **Frontend** — Next.js migration, terminal UI polish.

Check [GitHub Issues](https://github.com/utk2103/Prompt-Studio/issues) for
[`good first issue`](https://github.com/utk2103/Prompt-Studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) labels.

---

## Report a vulnerability

Report security issues directly via GitHub:
[utk2103/Prompt-Studio Security](https://github.com/utk2103/Prompt-Studio/security)

### Required in reports

1. **Title**
2. **Severity assessment**
3. **Impact**
4. **Affected component**
5. **Technical reproduction**
6. **Demonstrated impact**
7. **Environment**
8. **Remediation advice**

Reports without reproduction steps, demonstrated impact, and remediation advice get deprioritized.
