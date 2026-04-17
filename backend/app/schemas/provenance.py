# Response schema for GET /api/v1/provenance/{dataset_slug}/{model_name} (latest precompute run).

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProvenanceResponse(BaseModel):
    """Latest precompute run metadata for a dataset × model pair."""

    model_config = ConfigDict(from_attributes=True)

    dataset_slug: str
    model_name: str
    model_version: str
    git_sha: str
    created_at: datetime
    output_parquet_key: str
