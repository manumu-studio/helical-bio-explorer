# Unit tests for ParquetStore (S3 + local fallback) using moto S3 mocks.
# pyarrow ships without py.typed; relax import-untyped for this module only.
# mypy: disable-error-code=import-untyped

from __future__ import annotations

import io
import logging
from collections.abc import Callable
from pathlib import Path

import boto3
import pyarrow as pa
import pyarrow.parquet as pq
import pytest
from botocore.client import BaseClient
from botocore.exceptions import EndpointConnectionError
from moto import mock_aws

import app.services.parquet_store as parquet_store_module
from app.services.parquet_store import ParquetStore


class _Boto3ClientFactoryStub:
    """Test double that wraps boto3.client and injects a failing get_object."""

    def __init__(self, real_client: Callable[..., BaseClient]) -> None:
        self._real_client = real_client

    def client(self, *args: object, **kwargs: object) -> BaseClient:
        client = self._real_client(*args, **kwargs)

        def get_object(**_kwargs: object) -> dict[str, object]:
            raise EndpointConnectionError(endpoint_url="https://example.invalid")

        client.get_object = get_object  # type: ignore[attr-defined]

        return client


def _tiny_parquet_bytes() -> bytes:
    buffer = io.BytesIO()
    table = pa.table({"n": [1, 2, 3], "label": ["a", "b", "c"]})
    pq.write_table(table, buffer)
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_read_from_s3_happy_path() -> None:
    bucket = "test-bucket"
    dataset_slug = "ds1"
    artifact_type = "embeddings"
    version = "1"
    key = f"v{version}/{dataset_slug}/{artifact_type}.parquet"
    payload = _tiny_parquet_bytes()

    with mock_aws():
        conn = boto3.client("s3", region_name="us-east-1")
        conn.create_bucket(Bucket=bucket)
        conn.put_object(Bucket=bucket, Key=key, Body=payload)

        store = ParquetStore(
            bucket=bucket,
            region="us-east-1",
            endpoint_url=None,
            local_fallback_dir="/nonexistent/fallback",
        )

        data, source = await store.read(version, dataset_slug, artifact_type)

    assert source == "s3"
    assert data == payload


@pytest.mark.asyncio
async def test_fallback_when_s3_key_missing_and_local_exists(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    bucket = "test-bucket"
    dataset_slug = "ds1"
    artifact_type = "embeddings"
    version = "1"
    parquet_bytes = _tiny_parquet_bytes()

    local_dir = tmp_path / "parquet"
    local_file = local_dir / dataset_slug / f"{artifact_type}.parquet"
    local_file.parent.mkdir(parents=True)
    local_file.write_bytes(parquet_bytes)

    caplog.set_level(logging.WARNING)
    with mock_aws():
        conn = boto3.client("s3", region_name="us-east-1")
        conn.create_bucket(Bucket=bucket)

        store = ParquetStore(
            bucket=bucket,
            region="us-east-1",
            endpoint_url=None,
            local_fallback_dir=str(local_dir),
        )

        data, source = await store.read(version, dataset_slug, artifact_type)

    assert source == "local"
    assert data == parquet_bytes
    assert any("S3 read failed" in r.getMessage() for r in caplog.records)


@pytest.mark.asyncio
async def test_fallback_when_botocore_error(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    bucket = "test-bucket"
    dataset_slug = "ds1"
    artifact_type = "embeddings"
    version = "1"
    parquet_bytes = _tiny_parquet_bytes()

    local_dir = tmp_path / "parquet"
    local_file = local_dir / dataset_slug / f"{artifact_type}.parquet"
    local_file.parent.mkdir(parents=True)
    local_file.write_bytes(parquet_bytes)

    caplog.set_level(logging.WARNING)
    with mock_aws():
        conn = boto3.client("s3", region_name="us-east-1")
        conn.create_bucket(Bucket=bucket)
        monkeypatch.setattr(
            parquet_store_module,
            "boto3",
            _Boto3ClientFactoryStub(boto3.client),
        )

        store = ParquetStore(
            bucket=bucket,
            region="us-east-1",
            endpoint_url=None,
            local_fallback_dir=str(local_dir),
        )

        data, source = await store.read(version, dataset_slug, artifact_type)

    assert source == "local"
    assert data == parquet_bytes
    assert any("S3 read failed" in r.getMessage() for r in caplog.records)


@pytest.mark.asyncio
async def test_local_only_when_bucket_is_none(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """bucket=None skips S3 entirely and reads from local without warnings."""
    dataset_slug = "ds1"
    artifact_type = "embeddings"
    version = "1"
    parquet_bytes = _tiny_parquet_bytes()

    local_dir = tmp_path / "parquet"
    local_file = local_dir / dataset_slug / f"{artifact_type}.parquet"
    local_file.parent.mkdir(parents=True)
    local_file.write_bytes(parquet_bytes)

    caplog.set_level(logging.WARNING)
    store = ParquetStore(
        bucket=None,
        region="us-east-1",
        endpoint_url=None,
        local_fallback_dir=str(local_dir),
    )

    data, source = await store.read(version, dataset_slug, artifact_type)

    assert source == "local"
    assert data == parquet_bytes
    assert not any("S3 read failed" in r.getMessage() for r in caplog.records)


@pytest.mark.asyncio
async def test_raises_when_s3_and_local_miss(tmp_path: Path) -> None:
    bucket = "test-bucket"
    dataset_slug = "ds1"
    artifact_type = "embeddings"
    version = "1"

    local_dir = tmp_path / "parquet"

    with mock_aws():
        conn = boto3.client("s3", region_name="us-east-1")
        conn.create_bucket(Bucket=bucket)

        store = ParquetStore(
            bucket=bucket,
            region="us-east-1",
            endpoint_url=None,
            local_fallback_dir=str(local_dir),
        )

        with pytest.raises(FileNotFoundError, match="Parquet not found"):
            await store.read(version, dataset_slug, artifact_type)
