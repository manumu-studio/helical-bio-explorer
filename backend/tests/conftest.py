# Pytest fixtures: in-process AsyncClient over ASGITransport (no real network).

import os
from collections.abc import AsyncIterator

# Default URLs satisfy Settings validation before app import (real runs use Neon).
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://user:pass@localhost:5432/test",
)
os.environ.setdefault(
    "DIRECT_URL",
    "postgresql://user:pass@localhost:5432/test",
)

from app.core.config import get_settings

get_settings.cache_clear()

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """HTTP client that talks to the application in-process."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
