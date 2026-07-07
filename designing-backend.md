# Production Backend Guide — Lessons from Quater, Applied to KJ-backend

Derived from the Quater repo layout (`src/quater/`) and how its production code stays tight. Then a direct list of what KJ-backend does wrong today.

---

## 1. What Quater Gets Right

### 1.1 Directory Layout

```
src/quater/
├── app.py                 # thin: Quater class, route registration
├── router.py              # matching only
├── routing.py             # normalized route model
├── _route_definition.py   # single builder used by app + groups
├── groups.py              # RouteGroup — shares build_route_definition
├── core.py                # RouteDefinition, PublicSurfaces
├── dependencies.py        # Resource / ResourceMap primitives
├── middleware.py          # BeforeMiddleware, AfterMiddleware, stacks
├── params.py              # Path/Query/Body/Header/Cookie markers
├── request.py             # Request object
├── response.py            # Response object
├── schema.py              # request/response schema
├── serialization.py       # msgspec adapters
├── config.py              # AppConfig — frozen, validated once
├── exceptions.py          # QuaterError hierarchy
├── lifespan.py            # LifespanManager (state machine)
├── observability.py       # tracing / metrics hooks
├── security.py            # signed cookies, CSRF, safe defaults
├── auth.py                # AuthConfig, contexts
├── cors.py                # CORS middleware
├── cookies.py             # Cookie parsing
├── formdata.py            # multipart parsing
├── datastructures.py      # MultiDict etc.
├── testing.py             # TestClient (mirrors real ASGI/RSGI)
├── deployment.py          # deployment discovery/entrypoint
├── typing.py              # exported typing aliases
├── types.py               # internal type stubs
├── py.typed               # PEP-561 marker
├── _api_boundary.py       # what is public vs. private
├── _parameters.py         # private param resolution
├── _state.py              # private app.state impl
├── _finalize.py           # private compile-time finalization
├── _router.pyi            # Rust ext type stubs
├── protocol/              # ASGI / RSGI / actions protocol
├── adapters/              # asgi.py, rsgi.py, wsgi.py, _shared.py
├── actions/               # CLI-callable actions (approval, executor, registry)
├── tools/                 # MCP tools (descriptions, mcp, registry, schema, audit)
├── docs/                  # OpenAPI + Swagger generators
├── cli/                   # apps, client, discovery, main, server, remotes
└── native/                # Rust source (matching engine)
```

### 1.2 Layout Rules

1. **One responsibility per file.** `router.py` matches, `routing.py` models, `_route_definition.py` builds. Nothing else creeps in.
2. **Shared construction lives once.** `build_route_definition()` is called by `Quater.add_route()` **and** `RouteGroup.add_route()`. Validation and failure modes are identical because there is one code path.
3. **Underscore-prefixed private modules.** `_route_definition.py`, `_parameters.py`, `_state.py`, `_finalize.py`, `_api_boundary.py`. Public surface tiny; internals marked.
4. **Small public surface.** `_api_boundary.py` explicitly lists what `from quater import ...` sees. Nothing leaks by accident.
5. **Adapters and protocols are edge modules.** ASGI, RSGI, WSGI adapters sit in `adapters/`; each is thin and delegates to the same core. Adding a new protocol does not touch business logic.
6. **Domain-shaped subpackages.** `actions/`, `tools/`, `docs/`, `cli/` — each owns its concern end-to-end (registry, descriptions, executor). No cross-package back-references.
7. **Native code isolated.** Rust router lives in `native/`; the Python side sees `_router.abi3.so` + `_router.pyi` stub. Type checkers still work.
8. **Package is `src/`-layout.** Prevents accidental in-repo imports; tests import the installed package, not the source tree.

### 1.3 Registration & Validation Rules

- **Validate at the boundary, once.** Route configs validate at `add_route()` time. Handlers trust their inputs. No re-checking in hot paths.
- **Fail-fast at import/registration, not on first request.** `_validate_user_route_path`, `normalize_inject`, `validate_external_route_options` all run when the route is added. Bad config = server refuses to start.
- **Same error for same misuse regardless of API used.** `RouteGroup(...)` and `Quater.add_route(...)` raise the exact same `ConfigurationError` for the exact same reason.
- **Compile-time vs. add-time is intentional.** Simple, local checks run at `add_route()`. Cross-handler checks (unused injects, param marker conflicts) wait for route compilation because they need the whole plan. Both are documented.

### 1.4 Configuration Rules

- `AppConfig` is a **frozen dataclass**, validated once at construction. Every downstream module reads immutable fields.
- **No `os.getenv` scattered.** Environment lookup happens inside `AppConfig` factories or CLI entrypoints, never in business code.
- **`FrozenInstanceError` is expected.** Tests assert that mutating config after construction fails. That is the contract.
- **Defaults are explicit and typed.** Every optional setting has a sane default plus a validated type. No `None` sentinels leaking into feature code.
- **Secrets are not stringly-typed.** Signed cookie keys, JWT secrets, etc. are wrapped or read from `AuthConfig`.

### 1.5 Error Handling Rules

- **One base class, narrow leaves.** `QuaterError` is the root; `ConfigurationError`, `RouteConflictError`, `RouteBindingError`, `LifespanStateError`, `HTTPError`, `BadRequestError`, `RequestJSONError` all extend it. Never bare `Exception`.
- **HTTP errors carry status + detail as class attributes.** `BadRequestError.status_code = 400`. Subclasses override — no ad-hoc dicts.
- **Error messages are quoted verbatim in tests.** `pytest.raises(ConfigurationError, match="Invalid injected parameter name")`. Changing a message is a public-API change and must be intentional.
- **No `except Exception: pass`.** Every `except` handles a specific type or re-raises after cleanup.
- **Exception hierarchy mirrors `ValueError`/`RuntimeError` semantics** (`ImproperlyConfigured(QuaterError, ValueError)`), so idiomatic Python catches still work.

### 1.6 Lifespan Rules

- **Lifespan is a state machine.** `LifespanState` enum: `IDLE → STARTING → STARTED → STOPPING → STOPPED` (or `FAILED`). Every transition is guarded and raises `LifespanStateError` for invalid moves.
- **Startup and shutdown are LIFO.** Shutdown runs `reversed(_shutdown_hooks)` so teardown mirrors setup order.
- **Startup failure is terminal.** Once `FAILED`, the app refuses to start again — no half-initialized services.
- **No I/O at import time.** Anything that opens a socket, hits a DB, or spawns a task lives inside a lifespan hook, not at module top-level.

### 1.7 Middleware & Dependency Rules

- **Middleware is a value type.** `MiddlewareStack.from_parts(before=, after=, around=, exception_handlers=)` is built once and stored on the route. No monkeypatching.
- **`Resource` for injection, `app.state` for singletons.** These are the two ways to share objects; anything else is discouraged.
- **Resources are lazy.** A request that does not inject `session` never opens a DB connection.
- **Providers are async functions or async generators.** One `yield`, then cleanup. Multi-yield is a validated error.
- **Dependency cycles fail loud.** `Resource dependency cycle detected: a -> b -> a` is a startup error, not a runtime crash.

### 1.8 Public API Discipline

- `_api_boundary.py` names the surface. Anything not listed there is private and may change without a version bump.
- **`__init__.py` re-exports intentionally**, not `from x import *`.
- **PEP-561 typed package.** `py.typed` shipped. Downstream users get type hints without stubs.
- **Backwards-compat aliases are documented, not silent.** `ConfigurationError` is kept as an alias for `ImproperlyConfigured` — with a docstring saying why.

### 1.9 Testing Rules

- **Layout:** `tests/{unit, integration, security, typing, support}` — one location, structured by kind.
- **Fast unit suite.** 905 unit tests in 0.6s. Slow tests get their own directory (`integration/`) and are not blockers on every local run.
- **Tests mirror source.** `tests/unit/test_route_group.py` ↔ `src/quater/groups.py`. One hop to find coverage.
- **Type tests exist.** `tests/typing/` covers mypy contracts — if a public overload breaks, CI catches it.
- **Security tests exist.** `tests/security/` covers signed cookies, headers, CORS defaults. Not an afterthought.
- **Support tree for shared fixtures.** `tests/support/` — no cross-test drift by copy/paste.
- **`conftest.py` at the top level only.** Fixtures are scoped explicitly, not smeared through the tree.
- **`pytest.ini_options` is minimal.** `addopts = "-ra"`, `pythonpath = ["src"]`, `testpaths = ["tests"]`. Nothing magical.

### 1.10 Tooling & CI

- **Ruff** with `select = ["B", "E", "F", "I", "SIM", "UP"]` and `line-length = 88`. No debates.
- **Mypy strict** on `src` and `tests`. Types are load-bearing.
- **Pyrefly** as a second checker.
- **Bandit** for security smells; `exclude_dirs = ["tests", "sample_projects", "docs"]`.
- **Coverage** with `fail_under = 90`, `branch = true`.
- **uv** with a pinned minimum version for reproducibility.
- **`pyproject.toml` is the single source of truth.** No `setup.cfg`, no `setup.py`.

### 1.11 Documentation Rules

- **`docs/en/dev/` owns user-facing docs.** Changelog, quickstart, testing, security, deployment, stability, known-limitations. Same tree, one nav.
- **Every behavior change touches four things in one PR:** code, tests, docs, changelog. Nothing ships partial.
- **Error strings are documented.** `docs/en/dev/resources.md` lists actual error messages users will hit, each with a fix.
- **`README.md` is the elevator pitch**, not the manual. Deep docs live in `docs/`.
- **Changelog uses conventional headings.** `Added`, `Changed`, `Fixed`, each with issue links.

### 1.12 Contribution Rules

- Branch naming: `issue_{number}`.
- Only `accepted` issues are picked up; unclaimed only.
- One issue per PR, no drive-by cleanup.
- Small PRs preferred. Behavior change requires tests + docs + changelog.

### 1.13 Code Style Rules Quater Follows

- No `dict(inject or {})`-style silent coercions. Every `inject={...}` runs through `normalize_inject()` and raises `ConfigurationError` for bad names, `TypeError` for non-`Resource` values.
- No docstrings that explain what a function does; the name does that. Docstrings appear only where a class documents its contract (`LifespanManager`, `QuaterError`).
- No global mutable state outside `app.state` / `Resource` scope.
- Private helpers live next to their user, not in a `utils.py` grab bag. Quater has **no `utils.py`**.
- `__slots__` on hot-path classes (`LifespanManager`) — memory + attribute discipline.
- `from __future__ import annotations` on every module — cheap forward refs, no import cycles.
- `StrEnum` for state machines, not raw strings.
- Public functions type their inputs and outputs; no `Any` unless boundary-forced.
- Tests are runnable in <1 second.

### 1.14 Top-Level Repo Layout

Everything at the root has a defined purpose. No stray files, no PDFs, no logs.

```
quater/
├── src/quater/            # library code (src-layout)
├── native/router/         # Rust router, compiled to _router.abi3.so
├── tests/                 # unit/integration/security/typing/support
├── examples/              # runnable minimal apps
├── docs/                  # VitePress site (en/dev/*.md)
├── benchmarks/            # apps + scripts + results
├── scripts/               # build/codegen tooling
├── agent-skills/          # portable skills for LLM agents
├── release/               # per-version release notes
├── target/                # Rust build artifacts (gitignored)
├── Cargo.toml             # Rust package manifest
├── Cargo.lock             # Rust lockfile (committed)
├── pyproject.toml         # Python package + all tool config
├── uv.lock                # Python lockfile (committed)
├── package.json           # docs site (VitePress) only
├── package-lock.json      # docs site lockfile
├── vercel.json            # docs site deploy config
├── Dockerfile / Makefile  # (absent — none needed at root)
├── README.md              # elevator pitch
├── CONTRIBUTING.md        # contribution flow
├── LICENSE                # MIT
└── GETTING_STARTED.md     # first-run guide
```

### 1.15 `examples/` Rules

- **Every example is runnable in isolation** — no shared state between files, no external services required by default.
- **One concept per file.** `basic_app.py` shows the minimum; `auth_and_mcp.py` shows auth + MCP; `asgi_compat.py` / `wsgi_compat.py` show compat adapters. Not one giant example.
- **Examples import from the installed package**, not relative source. Same import path users see (`from quater import Quater, Request`).
- **Package with `__init__.py`.** Examples are importable, testable, and covered by mypy/pyrefly like real code.
- **Short.** `basic_app.py` fits under 30 lines. If an example needs more, it should be a doc page, not an example.
- **No `if __name__ == "__main__"` glue unless required.** Reader sees the API, not the runner.

### 1.16 `docs/` Rules

- **VitePress site.** Source in `docs/en/dev/*.md`, entry `docs/index.md`. Rendered site deploys via `vercel.json`.
- **Locale-first structure.** `docs/en/...` reserves room for translations without restructuring.
- **Reference is generated, not hand-written.** `scripts/generate_reference.py` walks `src/quater/__init__.py` with Griffe and writes `docs/en/dev/reference/*.md`. Hand-edits would drift.
- **`--check` mode gates CI.** `docs:reference:check` fails the build if the reference is stale — you cannot merge code that changes the public API without regenerating docs.
- **Public assets in `docs/public/`.** VitePress serves them at site root.
- **One doc home.** No parallel wiki, no `README.md` deep dives, no PDFs.

### 1.17 `scripts/` Rules

- **Tooling only.** Build helpers, codegen, doc generators. Never business logic.
- **Two file types allowed:** Python (`generate_reference.py`) and Node (`build-docs-site.mjs`). Match the tool being driven.
- **Run through the project's dependency manager.** Python scripts run under `uv run --no-sync`, so they see the pinned env — no bare `python scripts/foo.py`.
- **Every script has a `--check` or dry-run mode** if it produces committed output. Codegen without `--check` = merge conflicts + drift.
- **Path anchoring is explicit:** `REPO_ROOT = Path(__file__).resolve().parents[1]`. Scripts work regardless of CWD.

### 1.18 `benchmarks/` Rules

- **Fair fixtures.** Same task, one file per framework: `apps/no_db_quater.py` ↔ `apps/no_db_fastapi.py`. Reviewers can diff two files side-by-side.
- **`README.md` names the tradeoffs.** "Not a universal winner. Local numbers from one machine." No marketing.
- **Reproducible harness.** `docker-compose.yml` for the DB fixture; `scripts/run_suite.py` drives it; `scripts/generate_charts.py` renders SVGs from committed CSVs.
- **Results are versioned.** `results/*.csv` + `assets/*.svg` live in the repo so a reader sees the numbers without rerunning.
- **Isolated deps.** Benchmark apps do not depend on the library's dev group; they install what they need to run.

### 1.19 `agent-skills/` Rules

- **Portable skills** — one folder per skill, each with `SKILL.md` + optional `agents/` and `references/`.
- **Two audiences, two skills.** `quater-apps` (operate a running app) vs. `quater-framework` (build with the framework). Never mixed.
- **Short by design.** Skills load into agent context; big docs kill the context window. Deep info stays in `docs/`.
- **Skills point at canonical docs URL**, not local paths. Skills are portable across machines.

### 1.20 `release/` Rules

- **One file per version.** `release/0.1.0a1.md`, `release/0.2.0.md`. Immutable once cut.
- **Sections in a fixed order:** Prerequisites → Added → Changed → Fixed → Removed → Migration notes.
- **Every entry links its issue/PR.** No prose-only changelog items.
- **`docs/en/dev/changelog.md` is the aggregator.** Release files are the source of truth per version.

### 1.21 `native/` Rules (Rust extension)

- **Rust lives in one folder.** `native/router/src/lib.rs`. Python is not littered with `#[pyfunction]` files.
- **`Cargo.toml` at repo root**, `Cargo.lock` committed. Reproducible native builds.
- **PyO3 with `abi3` feature.** `abi3-py311` = one wheel for Python 3.11+, no per-version rebuild.
- **Rust module surfaced via `.pyi` stub.** `src/quater/_router.pyi` gives type checkers a real API for a compiled `.so`. Users see typed calls; the impl language does not matter.
- **Underscore-prefixed import name.** `quater._router` — not a public module.
- **Maturin builds it.** `pyproject.toml` sets `build-backend = "maturin"` and `[tool.maturin] module-name = "quater._router"`. One tool, one command (`uv pip install -e .`).

### 1.22 `Cargo.toml` Rules

- **Small manifest, clear crate.** Name, version (kept in lockstep with Python), edition = `2021`, one `[lib]` target, one `crate-type = ["cdylib"]`.
- **Version parity with the Python package.** Rust `0.2.1` matches Python `0.2.1`. Never diverge.
- **Minimal dependency set.** `matchit` for routing, `pyo3` for bindings. Adding a Rust dep = a review question, not a habit.
- **License and repo fields match Python.** `MIT`, same repo URL. No package-manager identity split.

### 1.23 `pyproject.toml` Rules (single source of truth)

- **Everything Python lives here.** No `setup.py`, no `setup.cfg`, no `requirements*.txt`.
- **`[project]` metadata is complete:** name, version, description, README, python-requires, license, authors, keywords, classifiers, URLs, scripts.
- **`requires-python = ">=3.11"`.** Aggressive floor unlocks `StrEnum`, `Self`, better generics.
- **Runtime deps are minimal + upper-bounded when needed.** `granian[reload]>=2.0`, `msgspec>=0.18`, `swagger-ui-bundle>=1.1.0`. Nothing you do not need at runtime.
- **Dev deps in `[dependency-groups]`, not `extras`.** PEP 735 groups keep the dev matrix out of published wheels.
- **`[project.scripts]` exposes the CLI.** `quater = "quater.cli.main:main"` — pip-installable, no shell wrapper.
- **All tool config co-located:**
  - `[tool.uv]` — `required-version = ">=0.7.8"`.
  - `[tool.maturin]` — `python-source = "src"`, `module-name = "quater._router"`.
  - `[tool.pytest.ini_options]` — `addopts = "-ra"`, `pythonpath = ["src"]`, `testpaths = ["tests"]`.
  - `[tool.ruff]` — `line-length = 88`, `target-version = "py311"`.
  - `[tool.ruff.lint]` — `select = ["B", "E", "F", "I", "SIM", "UP"]`.
  - `[tool.mypy]` — `strict = true`, `files = ["src", "tests"]`.
  - `[tool.coverage.run]` — `branch = true`, `source = ["quater"]`.
  - `[tool.coverage.report]` — `fail_under = 90`, `precision = 2`.
  - `[tool.bandit]` — `exclude_dirs = ["tests", "sample_projects", "docs"]`.
  - `[tool.pyrefly]` — second type checker.
- **`uv.lock` is committed.** Reproducible installs; CI never re-solves.
- **Build backend is explicit.** `[build-system] requires = ["maturin>=1.11,<2.0"] build-backend = "maturin"`. Not implicit setuptools.

### 1.24 `package.json` Rules (docs only)

- **Docs site is a separate world.** `"private": true`, no publish. Node exists only to run VitePress.
- **`packageManager` pinned.** `"packageManager": "npm@10.8.2"` = one npm across contributors.
- **Scripts are named for what they do**, not what they use. `docs:dev`, `docs:build`, `docs:preview`, `docs:reference`, `docs:reference:check`.
- **`overrides` pin transitive risk.** Force `vite`, `esbuild`, plugin versions to avoid drift.
- **Zero runtime deps.** Only `devDependencies`. Docs are a build-time output.
- **`package-lock.json` committed.** Deterministic docs builds.

### 1.25 Root-Level Files Rules

- **`README.md`** — elevator pitch, install command, one code sample, link to docs. Not the manual.
- **`CONTRIBUTING.md`** — contribution flow (accepted → claim → branch → PR).
- **`GETTING_STARTED.md`** — first-run guide, separate from README to keep both short.
- **`LICENSE`** — top-level, plain text.
- **No `Makefile`, no `Dockerfile` at root** unless the library ships them. Users run `uv run pytest`, not `make test`.
- **`.gitignore` covers:** `target/`, `.venv/`, `__pycache__/`, `*.pyc`, `dist/`, `build/`, `.uv-cache/`, editor droppings. Nothing in the tree that is generated.

---

## 2. Where KJ-backend Is Wrong

Direct list. No filler.

### Fatal: File-size discipline is gone
- `app/api/python/route.py` — **3030 lines**.
- `app/api/python/services.py` — **3162 lines**.
- `app/api/python/controller.py` — **927 lines**.
- `app/api/python/model.py` — **566 lines** (ORM only, should be smaller or split per aggregate).

Quater's largest module is `params.py` at ~1000 lines and it does one thing. Your route file has 100+ handlers pretending to be one file. **Split by feature: `route.py`, `route_pipeline.py`, `route_upload.py`, etc., or make sub-packages under `api/python/`.**

### Fatal: `Base.metadata.create_all(bind=engine)` at import time (`app/main.py:49`)
- Runs before lifespan. Runs in every subprocess (workers, tests, alembic).
- Bypasses migrations. Alembic exists in `app/db/migrations/` — it is the source of truth. Delete this line.
- Import-time DB connection = broken tests, broken CLI, broken worker isolation.

### Fatal: Import-time side effects and unused imports in `main.py`
Lines 36–41 import model modules purely to force SQLAlchemy registration. Comment says so. Fix: put every model behind `app/db/__init__.py` that imports them, and register there. `main.py` should have zero "for side effect" imports.

### Fatal: `main.py` is 276 lines
Compare to Quater `app.py` — thin. Yours has:
- Two 60-line pubsub subscriber coroutines defined inline.
- The lifespan context manager inline.
- CORS config with `allow_origins=["*"]` — production security hole. See below.
- 18 `include_router` lines with camelCase aliases (`pythonRoute`, `geminiRoute`).

Move the subscribers to `app/workers/pipeline_relay.py`. Move lifespan to `app/lifespan.py`. Have `main.py` do: build app, register routers, return.

### Security: CORS wide open
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```
`allow_origins=["*"]` in production ships every browser-side secret to any origin. Bind to your actual frontend origins. The commented `origins = ["http://192.168.211.:8000", ...]` above it is dead code with a typo (`.211.:8000`). Delete it.

### Style: naming is inconsistent
- `pythonRoute`, `geminiRoute`, `imagePipelineRoute` — camelCase in Python. Should be `python_router`, `gemini_router`.
- `app/api/python` is a meaningless folder name. It is Python, everything is Python. Rename to what the feature is (`pipeline`, `designs`, whatever it actually does).
- `duplicacy` — probably meant `duplication`. Confirm and fix repo-wide.

### Config: `core/config.py` and `core/settings.py` both exist
Pick one. Currently `config.py` is 21 lines and calls `os.getenv()` inside class defaults **and** relies on `SettingsConfigDict(env_file=...)`. That is doing the work twice. Do it once with pydantic-settings and remove the `os.getenv` fallbacks. Also, `env_file` is resolved at import; a Docker env override arrives too late. Quater keeps config in **one** frozen `AppConfig`.

### Structure: `utils/` is a graveyard
```
utils/bg_fix.py, chain_color.py, chain_length.py, image_quality.py, ring_color.py, ring_fidelity.py, necklace_fidelity.py
```
These are domain logic, not "utils". Move them into `app/services/scoring/` or under the feature owning them. Quater has zero `utils.py` — take the hint.

### Structure: `schemas/` has 3 files but every route defines Pydantic inline
`schemas/auth.py`, `schemas/files.py`, `schemas/image_qa.py`. Route files still define `class Response(BaseModel)` inline (`main.py:52`). Pick a rule: one `schemas.py` per feature under `app/api/<feature>/schemas.py`. Stop defining Pydantic models inside route files.

### Log files, PDFs, dumps in the working tree
```
api-2026-05-20.log … api-2026-07-07.log
dump.rdb
Rabbitmq Poc And Full Pipeline Architecture Document.pdf
comparison_stud_compressed.pdf
sql_report.pdf
```
Not source. `.gitignore` the logs and RDB, delete from tracking. PDFs move to `docs/` or `reports/`. Repo root should be small and predictable.

### Docs are scattered
`changelog.md` at root, `README.md` at root, `docs/` also exists, PDFs at root. Quater keeps everything under `docs/en/dev/`. Consolidate.

### Route file imports are unsorted and camelCase-aliased
`route.py` imports look like they were added one at a time with no cleanup. Group into stdlib / third-party / first-party. Kill the camelCase aliases. Ruff `select = ["I"]` sorts this in one command.

### Handlers are 200-line functions
Sampled `route.py` handlers do request parsing + DB access + external API calls + Redis pubsub + response formatting all inline. Every one of those belongs in a service. Route handlers should be **10–30 lines**: parse → call service → return.

### No dependency injection discipline
FastAPI has `Depends()` — you use it for `get_db`, `get_current_user`, and stop there. Long-lived resources (Redis client, HTTP clients, RabbitMQ connection) are imported as module globals. When you need to test one route, you cannot swap them. Introduce providers.

### Tests exist but structure unclear
Three test-ish directories: `test/`, `test-stud/`, `tests/`. Pick `tests/`. Delete the others or explain why they exist. Quater has exactly `tests/{unit,integration,security,typing,support}` — one location, structured by kind.

### `__pycache__` everywhere including checked-in
```
find . -name __pycache__ -exec rm -rf {} +
```
Add to `.gitignore`.

### Nothing enforces line length, imports, or types
No `pyproject.toml` config for ruff / mypy visible from the tree. A 3000-line `route.py` cannot survive without a linter and a max-file-lines rule. Add:
- Ruff `select = ["B", "E", "F", "I", "SIM", "UP"]`, `line-length = 88`.
- Mypy `strict = true` on `app/`.
- Bandit for security smells.
- Coverage with `fail_under` set to something ≥ 80.
- Wire all four into CI. Fail the build on any error.

### No exception hierarchy
No `KJError` base class anywhere. Handlers raise `HTTPException` directly with ad-hoc details. Compare Quater's `QuaterError → ImproperlyConfigured / HTTPError / BadRequestError / RequestJSONError`. Add one hierarchy under `app/exceptions.py` and raise domain errors instead of framework primitives.

### No lifespan state machine, no LIFO shutdown
Your lifespan spawns tasks with `asyncio.create_task(...)` and cancels them in whatever order. Startup failure has no defined outcome — you can get a half-booted app. Move to a small state machine like `LifespanManager` and reverse the shutdown order.

### Print statements as logging
`print(f"[WS RELAY] Event error: {e}", flush=True)` in `main.py`. You have `app/logger/logger.py`. Use it everywhere. Ban `print` via ruff (`T20`).

### Bare `except Exception: pass` in critical paths
Silently swallowing pubsub errors in the WS relay means a broken pipeline emits no signal. Log and re-raise (or reconnect deliberately). `grep -rn "except Exception" app/` — every hit is a bug in waiting.

---

## 3. Fix Order (Priority)

1. Delete `Base.metadata.create_all()` from `main.py`. Move to migrations-only.
2. Lock CORS to real origins.
3. `.gitignore` `*.log`, `dump.rdb`, `__pycache__/`, `*.pyc`. Remove tracked copies.
4. Add ruff + mypy + bandit + coverage in `pyproject.toml`. Fail CI on lint / type / security errors.
5. Split `app/api/python/route.py` and `services.py` into files ≤ 500 lines each, grouped by feature.
6. Move pubsub subscribers and lifespan out of `main.py`.
7. Consolidate `config.py`/`settings.py` into one pydantic-settings module.
8. Rename camelCase router aliases; rename `app/api/python/` to a real feature name.
9. Introduce `app/exceptions.py` hierarchy; replace ad-hoc `HTTPException` raises with domain errors.
10. Consolidate `test/`, `test-stud/`, `tests/` into one directory with `unit/integration/security/typing/support` subtrees.
11. Move PDFs and artifacts out of repo root.
12. Replace every `print(...)` with `logger.*` calls; ban `print` in ruff.

---

## 4. The Test That You Are Doing It Right

Quater's contract:

- `main.py` fits on one screen.
- Every route file fits on one screen of feature scope (~300 lines max).
- New contributor can find the code for a feature in one directory hop.
- Tests run in <5 seconds.
- No import-time DB or network I/O.
- `grep -rn "os.getenv" src/` returns only the settings module.
- `grep -rn "except Exception" src/` returns near-zero results.
- `grep -rn "print(" src/` returns zero results (use the logger).
- `wc -l src/**/*.py | sort -n | tail` — no file over ~1000 lines.
- Every behavior change ships as one PR touching code + tests + docs + changelog.

Run those greps on `app/`. Every hit is a place to fix.
