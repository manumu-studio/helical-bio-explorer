# FastAPI dependency providers (cached singletons for expensive service clients).

from functools import lru_cache

from app.core.config import get_settings
from app.services.parquet_store import ParquetStore


@lru_cache(maxsize=1)
def get_parquet_store() -> ParquetStore:
    """Return a process-wide ParquetStore built from application settings."""

    settings = get_settings()
    return ParquetStore(
        bucket=settings.s3_bucket,
        region=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url,
        local_fallback_dir=settings.parquet_local_fallback_dir,
    )
