# Prompt Studio

<div>
  <img src="https://badgen.net/badge/status/Under%20Development/red?icon=lgtm" alt="status">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="version">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="license">
  <img src="https://img.shields.io/github/commit-activity/m/utk2103/Prompt-Studio" alt="commits">
  <img src="https://img.shields.io/github/repo-size/utk2103/Prompt-Studio" alt="repo size">
  <img src="https://img.shields.io/badge/code%20style-ruff-000000.svg" alt="code style">
</div>

<br>

AI-powered prompt engineering workbench — analyze, score, optimize, and store prompts with a terminal-style UI and a FastAPI backend backed by PostgreSQL + pgvector.

<hr>

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
├── main.py                  # FastAPI app — all routes
├── models.py                # SQLAlchemy ORM models (PromptRecord, HistoryRecord)
├── database.py              # Engine, session, Base
├── alembic.ini              # Alembic config
├── alembic/
│   ├── env.py               # Migration environment (reads DATABASE_URL)
│   └── versions/
│       └── 001_initial_schema.py   # Creates prompts + history tables with ivfflat index
├── pyproject.toml           # Project metadata + PDM scripts
├── requirements.txt         # Pip-compatible dep list
├── dockerfile               # Multi-stage Docker build for the API
├── docker-ignore.yml        # docker-compose: db (pgvector) + api + frontend
├── .dockerignore
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
uvicorn main:app --reload --port 8000
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
