# Health check router exposing GET /health for load balancers and integration probes.

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    """JSON body returned by the health endpoint."""

    status: Literal["ok"]


@router.get("/health", response_model=HealthResponse)
def read_health() -> HealthResponse:
    """Return a minimal ok payload when the process is alive."""

    return HealthResponse(status="ok")
