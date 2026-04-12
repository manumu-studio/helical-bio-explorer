# GET /api/datasets — returns registry of scientific datasets from Neon via SQLModel async.

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db.models import Dataset
from app.db.session import get_session
from app.schemas.datasets import DatasetOut, DatasetsResponse

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("", response_model=DatasetsResponse)
async def list_datasets(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DatasetsResponse:
    """Return all datasets ordered by slug."""

    result = await session.exec(select(Dataset).order_by(Dataset.slug))
    rows = result.all()
    return DatasetsResponse(
        items=[DatasetOut.model_validate(row) for row in rows],
        total=len(rows),
    )
