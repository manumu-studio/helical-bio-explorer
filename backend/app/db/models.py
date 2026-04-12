# SQLModel ORM tables for dataset registry and precompute provenance (ADR-003).

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel


class Dataset(SQLModel, table=True):
    """Registered single-cell dataset available to the demo."""

    __tablename__ = "datasets"

    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    slug: str = Field(unique=True, index=True, min_length=1, max_length=64)
    display_name: str
    citation: str
    license: str
    cell_count: int = Field(ge=0)
    gene_count: int = Field(ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    precompute_runs: list["PrecomputeRun"] = Relationship(back_populates="dataset")


class PrecomputeRun(SQLModel, table=True):
    """One offline precompute job and its output artifact location."""

    __tablename__ = "precompute_runs"

    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    dataset_id: UUID = Field(foreign_key="datasets.id", index=True)
    model_name: str
    model_version: str
    parameters: dict[str, object] = Field(default_factory=dict, sa_column=Column(JSON))
    output_parquet_key: str
    git_sha: str = Field(min_length=7, max_length=40)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    dataset: Dataset | None = Relationship(back_populates="precompute_runs")
