# Pydantic response models for PACKET-03 parquet-serving API routes (typed JSON boundaries).

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class CellPoint(BaseModel):
    """Single cell in UMAP space with identity and type labels."""

    model_config = ConfigDict(extra="forbid")

    cell_id: str
    cell_type: str
    umap_1: float
    umap_2: float


class EmbeddingResponse(BaseModel):
    """Healthy reference embeddings as UMAP coordinates plus metadata."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    model: str
    total_cells: int
    sampled: int
    source: Literal["s3", "local"]
    cells: list[CellPoint]


class ProjectedCell(CellPoint):
    """Disease cell projected into reference space with activity and distance."""

    model_config = ConfigDict(extra="forbid")

    disease_activity: str
    distance_to_healthy: float


class ProjectionResponse(BaseModel):
    """Projected disease cells for a given foundation model."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    model: str
    total_cells: int
    sampled: int
    source: Literal["s3", "local"]
    cells: list[ProjectedCell]


class CellScore(BaseModel):
    """Per-cell distances to the healthy manifold for both models."""

    model_config = ConfigDict(extra="forbid")

    cell_id: str
    cell_type: str
    disease_activity: str
    distance_geneformer: float
    distance_genept: float


class ScoresResponse(BaseModel):
    """Distance scores table as JSON."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    total_cells: int
    sampled: int
    source: Literal["s3", "local"]
    cells: list[CellScore]


class DisagreementCell(CellScore):
    """Cell score row plus cross-model disagreement magnitude."""

    model_config = ConfigDict(extra="forbid")

    disagreement: float


class DisagreementResponse(BaseModel):
    """Cross-model disagreement per cell."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    total_cells: int
    sampled: int
    source: Literal["s3", "local"]
    cells: list[DisagreementCell]


class CellTypeSummary(BaseModel):
    """Aggregated stats for one cell_type × disease_activity group."""

    model_config = ConfigDict(extra="forbid")

    cell_type: str
    disease_activity: str
    count: int
    mean_distance_geneformer: float
    std_distance_geneformer: float
    mean_distance_genept: float
    std_distance_genept: float
    mean_disagreement: float
    std_disagreement: float


class SummaryResponse(BaseModel):
    """Server-side aggregates over full distance and disagreement tables."""

    model_config = ConfigDict(extra="forbid")

    dataset: str
    source: Literal["s3", "local"]
    groups: list[CellTypeSummary]
