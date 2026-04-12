# Response schemas for /api/datasets endpoint; wire format decoupled from SQLModel tables.

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DatasetOut(BaseModel):
    """One dataset row as returned to API clients."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    display_name: str
    citation: str
    license: str
    cell_count: int
    gene_count: int
    created_at: datetime


class DatasetsResponse(BaseModel):
    """Full list response for GET /api/datasets."""

    items: list[DatasetOut]
    total: int
