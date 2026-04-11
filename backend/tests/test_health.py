# Smoke test for /health. Confirms 200 + correct payload + X-Request-ID header propagation.

import re

import pytest
from httpx import AsyncClient

_REQUEST_ID_UUID4 = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\Z",
    re.IGNORECASE,
)


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient) -> None:
    """GET /health returns JSON ok and a UUID4-shaped X-Request-ID when none is sent."""

    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    rid = response.headers.get("x-request-id", "")
    assert rid != ""
    assert _REQUEST_ID_UUID4.match(rid) is not None


@pytest.mark.asyncio
async def test_request_id_echoes_incoming_header(client: AsyncClient) -> None:
    """Client-provided X-Request-ID is returned unchanged on the response."""

    custom = "my-trace-id"
    response = await client.get("/health", headers={"X-Request-ID": custom})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom
