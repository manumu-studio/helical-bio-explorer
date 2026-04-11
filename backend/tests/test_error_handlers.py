# Tests for AppError and unhandled handlers via temporary routes on an isolated app instance.

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.errors import AppError
from app.main import create_app


@pytest_asyncio.fixture
async def client_with_debug_routes() -> AsyncIterator[AsyncClient]:
    """App with throw routes only for handler verification (not shipped in create_app())."""

    app = create_app()

    @app.get("/debug-error")
    async def debug_error() -> None:
        raise AppError("test", status_code=418)

    @app.get("/debug-crash")
    async def debug_crash() -> None:
        raise RuntimeError("boom")

    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_app_error_returns_payload(client_with_debug_routes: AsyncClient) -> None:
    """AppError responses include message and request_id without tracebacks."""

    response = await client_with_debug_routes.get("/debug-error")
    assert response.status_code == 418
    body = response.json()
    assert body["error"] == "test"
    assert body["request_id"] is not None


@pytest.mark.asyncio
async def test_unhandled_exception_is_sanitized(client_with_debug_routes: AsyncClient) -> None:
    """Unhandled errors return a generic message; ServerErrorMiddleware may re-raise to ASGI."""

    response = await client_with_debug_routes.get("/debug-crash")
    assert response.status_code == 500
    body = response.json()
    assert body["error"] == "Internal server error"
    assert body["request_id"] is not None
