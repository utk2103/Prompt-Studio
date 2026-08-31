from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_config
from app.exceptions import HTTPError
from app.lifespan import lifespan, lifespan_manager
from app.logger import logger
from app.routes import analyze, compress, health, history, models, optimize, score, tokens, ui, wizard

API_PREFIX = "/api/v1"


@lifespan_manager.on_startup
async def _load_model_catalog() -> None:
    """Seed the catalog on first boot and load it into the registry overlay.
    Best-effort: a missing/unreachable DB must not stop the app from starting."""
    from app.db.session import SessionLocal
    from app.services import model_catalog

    try:
        db = SessionLocal()
        try:
            model_catalog.seed_if_empty(db)
            model_catalog.load_overlay(db)
        finally:
            db.close()
    except Exception:
        logger.warning("model catalog startup skipped (DB unavailable)", exc_info=True)


def create_app() -> FastAPI:
    cfg = get_config()
    app = FastAPI(
        title=cfg.app_name,
        version=cfg.app_version,
        description="Prompt engineering assistant: scoring, validation, token analysis, model compatibility",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.allow_origins,
        allow_methods=cfg.allow_methods,
        allow_headers=cfg.allow_headers,
    )

    @app.exception_handler(HTTPError)
    async def _handle_domain_error(_: Request, exc: HTTPError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.__class__.__name__, "detail": exc.detail},
        )

    # Meta routes stay at root; feature routes under /api/v1.
    app.include_router(health.router)
    app.include_router(ui.router)
    for router in (
        models.router,
        analyze.router,
        score.router,
        tokens.router,
        optimize.router,
        wizard.router,
        compress.router,
        history.router,
    ):
        app.include_router(router, prefix=API_PREFIX)

    return app


app = create_app()
