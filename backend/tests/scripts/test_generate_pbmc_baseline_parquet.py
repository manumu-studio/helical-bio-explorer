# Tests for scripts/generate_pbmc_baseline_parquet.py (PACKET-02a baseline parquet + DB row).

from __future__ import annotations

import argparse
import importlib.util
import sys
import types
from pathlib import Path

import pyarrow.parquet as pq
import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = REPO_ROOT / "backend"
SCRIPT_PATH = REPO_ROOT / "scripts" / "generate_pbmc_baseline_parquet.py"


def _load_generator_module() -> types.ModuleType:
    spec = importlib.util.spec_from_file_location(
        "generate_pbmc_baseline_parquet",
        SCRIPT_PATH,
    )
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_MOD = _load_generator_module()

EXPECTED_LOUVAIN = {
    "CD4 T cells",
    "CD14+ Monocytes",
    "B cells",
    "CD8 T cells",
    "NK cells",
    "FCGR3A+ Monocytes",
    "Dendritic cells",
    "Megakaryocytes",
}


def test_parquet_shape_and_columns(tmp_path: Path) -> None:
    args = argparse.Namespace(
        out_dir=tmp_path,
        upload_s3=False,
        skip_db=True,
        git_sha="deadbeef0" * 4,
        git_sha_resolved="deadbeef0" * 4,
    )
    assert _MOD.main(args) == 0
    path = tmp_path / "geneformer_embeddings.parquet"
    table = pq.read_table(path)
    assert table.num_rows == 2638
    assert table.num_columns == 516
    names = set(table.column_names)
    emb = {f"embedding_{i}" for i in range(512)}
    assert names == {"cell_id", "cell_type", "umap_1", "umap_2"} | emb
    df = table.to_pandas()
    uniques = {str(x) for x in df["cell_type"].unique()}
    assert uniques.issubset(EXPECTED_LOUVAIN)
    for i in range(512):
        col = df[f"embedding_{i}"]
        assert bool((col == 0.0).all()) is True


async def test_precompute_run_row_written(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    if str(BACKEND_ROOT) not in sys.path:
        sys.path.insert(0, str(BACKEND_ROOT))

    db_file = tmp_path / "precompute.sqlite"
    url = f"sqlite+aiosqlite:///{db_file}"

    monkeypatch.setenv("DATABASE_URL", url)

    from app.db.models import Dataset, PrecomputeRun  # noqa: PLC0415

    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine) as session:
        session.add(
            Dataset(
                slug="pbmc3k",
                display_name="PBMC 3k (healthy reference)",
                citation="10x Genomics, 2016",
                license="CC BY 4.0",
                cell_count=2638,
                gene_count=13714,
            )
        )
        await session.commit()
    await engine.dispose()

    rid = await _MOD.write_precompute_run(
        "test-sha1",
        "v1/pbmc3k/geneformer_embeddings.parquet",
    )
    assert rid is not None

    engine2 = create_async_engine(url)
    async with AsyncSession(engine2) as session:
        res = await session.exec(select(PrecomputeRun))
        rows = res.all()
        assert len(rows) == 1
        row = rows[0]
        assert row.model_name == "scanpy_baseline"
        assert row.model_version == "placeholder-v1"
        assert row.git_sha == "test-sha1"
        assert row.output_parquet_key == "v1/pbmc3k/geneformer_embeddings.parquet"
        # Parameters JSON must flag this as a placeholder superseded by PACKET-02b
        # so downstream consumers (and interview walkthroughs) never mistake
        # zero-padded columns for real Geneformer output.
        params = row.parameters
        assert isinstance(params, dict)
        assert "superseded by PACKET-02b" in str(params.get("note", ""))
        assert params.get("umap_source") == "adata.obsm['X_umap']"
        assert params.get("label_source") == "adata.obs['louvain']"
        assert params.get("embedding_columns") == "zeros (n, 512)"
    await engine2.dispose()
