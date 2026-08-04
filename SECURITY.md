# Security Policy

## Supported Versions

Only the latest stable release of Prompt Studio is supported with security patches.

## Reporting a Vulnerability

If you identify a security vulnerability in Prompt Studio (such as SQL/prompt injection, auth bypass, API key leakage, SSRF via LLM providers, arbitrary file access, or unsafe deserialization in the FastAPI backend or Next.js frontend), please do **not** open a public issue.

Report vulnerabilities privately via [GitHub's private vulnerability reporting](https://github.com/utk2103/Prompt-Studio/security/advisories/new) or email the maintainer at btoshine774@gmail.com.

Expect an acknowledgement within 72 hours and a triage decision within 7 days.

## Scope

In scope:
- FastAPI backend (`app/`, `routes/`, `services/`)
- Next.js frontend (`frontend/`)
- Alembic migrations (`alembic/`)
- Local skills, hooks, and commands (`skills/`, `hooks/`, `commands/`)
- `lean-mcp` middleware
- Install and setup scripts (`scripts/`, `dockerfile`)

Out of scope:
- Vulnerabilities in upstream LLM providers (OpenAI, Anthropic, etc.) — report to the provider
- Findings that require a pre-compromised host or root access
- Rate-limit or brute-force reports without a working PoC

## Privacy & Data Handling

Prompt Studio has no telemetry. No analytics, no crash reporting, no phone-home. Prompts, scores, and embeddings are stored in the Postgres (pgvector) or SQLite database you configure — nothing is sent to a Prompt Studio backend, because none exists.

### Data that leaves your machine

Only what you explicitly configure:

- **LLM providers**: prompts you analyze/score/optimize are sent to the provider whose API key you set (OpenAI, Anthropic, etc.) via LiteLLM routing. Provider retention policies apply.
- **pgvector / Postgres**: if you point Prompt Studio at a remote database, prompts and embeddings travel to that database. Local SQLite keeps everything on disk.

Nothing else. The frontend talks only to your backend; the backend talks only to your database and the LLM provider(s) you configured.

### Secrets

- API keys are read from environment variables and never logged.
- Per-user API keys (multi-tenant mode) are stored encrypted at rest and scoped to `user_id`.
- Never commit `.env` files — the repo `.gitignore` excludes them; audit before pushing.

## Deployment Hardening

- Set `SECRET_KEY` / JWT signing key to a strong random value in production; never reuse the dev default.
- Run Postgres with TLS and least-privilege credentials.
- Put the FastAPI app behind a reverse proxy (nginx/Caddy) with TLS termination and request-size limits.
- Enable CORS only for the domains you actually serve the frontend from.
- Keep dependencies current: `pip install -U -r requirements.txt` and `npm audit fix` in `frontend/`.

## Air-gapped / Self-hosted use

Prompt Studio runs fully self-hosted. With local models (via LiteLLM's local provider config) and SQLite, no network egress is required after install.
