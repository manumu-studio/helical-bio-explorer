# Pure PyArrow helpers: parse parquet bytes, filter, sample, and export column subsets as dicts.
# pyarrow ships without py.typed; relax import-untyped for this module only.
# mypy: disable-error-code=import-untyped

from __future__ import annotations

import io
import random
from typing import cast

import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq


def read_parquet_table(data: bytes) -> pa.Table:
    """Parse raw parquet bytes into a PyArrow Table."""

    return pq.read_table(io.BytesIO(data))


def filter_table(
    table: pa.Table,
    cell_type: str | None = None,
    disease_activity: str | None = None,
) -> pa.Table:
    """Apply optional column filters; skip filters when the column is absent."""

    result = table
    if cell_type is not None and "cell_type" in result.column_names:
        mask = pc.equal(result["cell_type"], pa.scalar(cell_type))
        result = result.filter(mask)
    if disease_activity is not None and "disease_activity" in result.column_names:
        mask = pc.equal(result["disease_activity"], pa.scalar(disease_activity))
        result = result.filter(mask)
    return result


def sample_table(
    table: pa.Table,
    sample_size: int,
    seed: int = 42,
) -> tuple[pa.Table, int]:
    """Randomly sample up to sample_size rows; sample_size <= 0 keeps all rows."""

    total_rows = table.num_rows
    if sample_size <= 0 or sample_size >= total_rows:
        return table, total_rows

    rng = random.Random(seed)
    indices = sorted(rng.sample(range(total_rows), k=sample_size))
    taken = table.take(pa.array(indices))
    return taken, total_rows


def table_to_dicts(table: pa.Table, columns: list[str]) -> list[dict[str, object]]:
    """Select columns and return each row as a plain dict (values as Python objects)."""

    subset = table.select(columns)
    rows = subset.to_pylist()
    return cast(list[dict[str, object]], rows)
