<div align= "center">
<p align="center">
  <img width="320" height="320" src="/public/prompt-studio.png" alt="Material Bread logo" style="margin-right:20px;">
</p>
<h1>Prompt Studio</h1>
<br>

AI-powered prompt engineering workbench — analyze, score, optimize, and store prompts with a terminal-style UI and a FastAPI backend backed by PostgreSQL + pgvector.

<div>
  <img src="https://badgen.net/badge/status/Under%20Development/red?icon=lgtm" alt="status">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="version">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="license">
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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI · Python 3.11+ · Pydantic v2 |
| Database | PostgreSQL 16 + pgvector · SQLAlchemy 2 · Alembic |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Containerization | Docker · docker-compose |

## Project Structure

```
Prompt-Studio/
├── app/
│   ├── main.py              # FastAPI app init + router registration
│   ├── config.py            # Settings (env-driven)
│   ├── lifespan.py          # Startup/shutdown hooks
│   ├── routes/              # Thin API endpoints
│   ├── services/            # Business logic
│   │   ├── skills.py        # Lean persona loader + mode filter (lite/full/ultra)
│   │   ├── formats.py       # Per-provider adapters + build_messages()
│   │   ├── models_registry.py
│   │   ├── analyze.py       compress.py scoring.py tokens.py optimize.py wizard.py
│   ├── schemas/             # Pydantic request/response models
│   ├── db/                  # Engine, session, ORM
│   └── skills/lean/SKILL.md # Persona source of truth
├── lean-mcp/                # MCP stdio server (Python, FastMCP)
│   ├── server.py            instructions.py test/
├── benchmarks/              # Python arm harness (baseline / caveman / lean-*)
│   ├── benchmark.py         arms/ agentic/ test_arms.py
├── alembic/                 # DB migrations
├── tests/                   # pytest suite (unit + integration)
├── pyproject.toml           requirements.txt
├── dockerfile               docker-ignore.yml
└── frontend/
    ├── Dockerfile           # Multi-stage Next.js build
    ├── app/                 # Next.js App Router
    │   ├── layout.tsx
    │   ├── page.tsx         # Root page — full app state lives here
    │   └── globals.css      # CRT terminal aesthetic + Tailwind base
    ├── components/
    │   ├── Header.tsx
    │   ├── SideNav.tsx
    │   ├── StatusBar.tsx
    │   ├── BarViz.tsx
    │   ├── ToastContainer.tsx
    │   └── views/           # One component per view (Analyze, Score, Tokens, …)
    └── lib/
        ├── types.ts
        ├── constants.ts     # Fallback model list + wizard questions
        ├── scoring.ts       # Local scoring engine (mirrors backend logic)
        ├── api.ts           # apiFetch + initAPI
        └── utils.ts         # tok(), fmtN(), wc()
```

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

Migrations run automatically on API container startup (`alembic upgrade head`).

### Database migrations (manual)

```bash
# Apply all pending migrations
pdm run migrate

# Auto-generate a new migration from model changes
pdm run make_migration "describe your change"

# Roll back one step
pdm run rollback
```

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

Prompt-Studio ships a ponytail-inspired **Lean** persona (`app/skills/lean/SKILL.md`) that reduces LLM output size, cost, and latency. One source of truth, filtered per intensity by `app/services/skills.py::get_lean_instructions(mode)` and injected in the system slot by per-provider adapters in `app/services/formats.py`.

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

## Install as a Claude Code Plugin

Prompt-Studio ships a Claude Code plugin (`.claude-plugin/`) that injects the Lean persona into every session via `SessionStart` + `SubagentStart` + `UserPromptSubmit` hooks.

### From GitHub (recommended)

Inside Claude Code:

```
/plugin marketplace add utk2103/Prompt-Studio
/plugin install prompt-studio@prompt-studio
```

Start a new session — the SessionStart hook fires and the Lean ruleset lands in the system context.

### From a local clone

```
/plugin marketplace add /path/to/Prompt-Studio
/plugin install prompt-studio@prompt-studio
```

### Use it

Claude Code namespaces plugin slash-commands by plugin name. Both forms work — the mode-tracker hook accepts either.

| Command                          | Effect |
|----------------------------------|--------|
| `/prompt-studio:lean lite`       | Switch to minimum-payload intensity |
| `/prompt-studio:lean full`       | Default intensity |
| `/prompt-studio:lean ultra`      | Maximum guidance |
| `/prompt-studio:lean off` or `stop lean` | Deactivate for the session |

Short form (`/lean lite`, `/lean full`, `/lean ultra`, `stop lean`) also works because the hook parses the raw prompt on `UserPromptSubmit` — even when Claude Code's slash-command menu doesn't recognize the un-namespaced form.

Mode persists in `~/.claude/.lean-active` across turns. Subagents spawned via `Task` inherit the ruleset through the `SubagentStart` hook — no drift.

### Troubleshooting

- `/lean` shows "command not found" in the menu → use `/prompt-studio:lean` instead; the raw `/lean X` form still works if you submit it as a message.
- Hooks don't fire → confirm `python3` is on `PATH` (`which python3`), then check `~/.claude/plugins/*/prompt-studio/hooks/` exists after install.
- Nothing in system context after `SessionStart` → run `python3 hooks/lean_activate.py` manually from the plugin dir; if it prints the ruleset, the manifest is wired correctly and the issue is Claude Code hook execution.

### Requirements

- `python3` on `PATH` (all hooks are Python; no Node runtime needed).
- Read access to the cloned repo (hooks resolve `${CLAUDE_PLUGIN_ROOT}/app/skills/lean/SKILL.md`).

## Database Schema

Two tables, managed by Alembic:

**`prompts`** — full prompt records with vector embeddings
- Stores prompt text, mode, model, all 7 score dimensions, issues JSON, recommendations JSON
- `embedding` column — `vector(1536)`, populated when an embedding model is wired in
- `ivfflat` cosine index for approximate nearest-neighbour semantic search

**`history`** — lightweight session entries
- Preview text, mode, model, overall score
- FK to `prompts.id` for drill-down

Embedding dimension defaults to `1536` (OpenAI `text-embedding-3-small`). Change `EMBEDDING_DIM` in `models.py` and generate a new migration to use a different model (e.g. `384` for `all-MiniLM-L6-v2`).

## Environment Variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://promptstudio:promptstudio@localhost:5432/promptstudio
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License — see [LICENSE](LICENSE).
