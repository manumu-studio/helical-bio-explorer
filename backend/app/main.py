# FastAPI app factory: wiring only; feature code lives in app/api/ and app/core/.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.core.middleware import RequestIDMiddleware


def create_app() -> FastAPI:
    """Construct and configure the FastAPI application instance."""

    settings = get_settings()
    setup_logging(settings.log_level, settings.env)
    app = FastAPI(title="helical-bio-explorer", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)
    register_exception_handlers(app)
    app.include_router(health.router)
    return app


app = create_app()
