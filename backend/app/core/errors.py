# AppError base class and global FastAPI handlers; JSON responses never include tracebacks.

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Expected failure surfaced to the client as JSON."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message: str = message
        self.status_code: int = status_code
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    """Register AppError and catch-all handlers that log server-side only."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "request_id": request_id},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, _exc: Exception) -> JSONResponse:
        req_logger = getattr(request.state, "logger", None)
        if req_logger is not None:
            req_logger.exception("unhandled_exception")
        else:
            logging.getLogger("app").exception("unhandled_exception")
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "request_id": request_id},
        )
