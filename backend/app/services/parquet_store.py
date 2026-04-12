# Reads versioned Parquet bytes from S3 with local filesystem fallback (ADR-005).

import asyncio
import logging
from pathlib import Path
from typing import Literal, Protocol, cast

import boto3
from botocore.client import BaseClient
from botocore.exceptions import BotoCoreError, ClientError
from botocore.response import StreamingBody

logger = logging.getLogger(__name__)


class _S3GetObjectClient(Protocol):
    def get_object(self, *, Bucket: str, Key: str) -> dict[str, object]: ...


class ParquetStore:
    """Reads versioned parquet from S3 with local fallback (ADR-005)."""

    def __init__(
        self,
        bucket: str | None,
        region: str = "us-east-1",
        endpoint_url: str | None = None,
        local_fallback_dir: str = "data/parquet",
    ) -> None:
        self._bucket = bucket
        self._region = region
        self._endpoint_url = endpoint_url
        self._local_fallback_dir = Path(local_fallback_dir)
        self._s3_client: BaseClient | None = None

    def _s3_key(self, version: str, dataset_slug: str, artifact_type: str) -> str:
        return f"v{version}/{dataset_slug}/{artifact_type}.parquet"

    def _local_path(self, dataset_slug: str, artifact_type: str) -> Path:
        return self._local_fallback_dir / dataset_slug / f"{artifact_type}.parquet"

    def _get_s3_client(self) -> BaseClient:
        if self._s3_client is None:
            self._s3_client = boto3.client(
                "s3",
                region_name=self._region,
                endpoint_url=self._endpoint_url,
            )
        return self._s3_client

    def _read_s3_sync(self, key: str) -> bytes:
        if self._bucket is None:
            msg = "S3 read requested without S3_BUCKET configured"
            raise RuntimeError(msg)
        client = cast(_S3GetObjectClient, self._get_s3_client())
        response = client.get_object(Bucket=self._bucket, Key=key)
        body = response["Body"]
        if not isinstance(body, StreamingBody):
            msg = "Unexpected S3 response body type"
            raise TypeError(msg)
        return body.read()

    def _read_local_sync(self, dataset_slug: str, artifact_type: str) -> bytes:
        path = self._local_path(dataset_slug, artifact_type)
        return path.read_bytes()

    async def read(
        self,
        version: str,
        dataset_slug: str,
        artifact_type: str,
    ) -> tuple[bytes, Literal["s3", "local"]]:
        """Return raw parquet bytes and whether they were served from S3 or local disk."""

        key = self._s3_key(version, dataset_slug, artifact_type)

        if self._bucket is not None:
            try:
                data = await asyncio.to_thread(self._read_s3_sync, key)
                return data, "s3"
            except (ClientError, BotoCoreError) as exc:
                logger.warning(
                    "S3 read failed for s3://%s/%s; falling back to local: %s",
                    self._bucket,
                    key,
                    exc,
                )
        else:
            logger.debug("S3_BUCKET unset; reading local parquet only for key %s", key)

        try:
            local_bytes = await asyncio.to_thread(
                self._read_local_sync,
                dataset_slug,
                artifact_type,
            )
        except FileNotFoundError as exc:
            msg = (
                f"Parquet not found in S3 (bucket={self._bucket!r}, key={key!r}) "
                f"or locally at {self._local_path(dataset_slug, artifact_type)!s}"
            )
            raise FileNotFoundError(msg) from exc

        return local_bytes, "local"
