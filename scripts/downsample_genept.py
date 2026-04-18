# Downsample GenePT parquet files and drop raw embedding columns.
# The API only needs cell_id, cell_type, umap_1, umap_2 (+ disease fields for projections).
# Run locally: python scripts/downsample_genept.py
# Then scp the output files to the EC2.

import random
from pathlib import Path

import pyarrow.parquet as pq

SEED = 42
SAMPLE_SIZE = 5000
DATA_DIR = Path(__file__).resolve().parent.parent / "backend" / "data" / "parquet"

# Columns the API actually reads (see embeddings.py lines 51 and 91-98)
KEEP_COLS_EMBEDDINGS = ["cell_id", "cell_type", "umap_1", "umap_2"]
KEEP_COLS_PROJECTED = [
    "cell_id", "cell_type", "umap_1", "umap_2",
    "disease_activity", "distance_to_healthy",
]

TARGETS = [
    ("pbmc3k", "genept_embeddings", KEEP_COLS_EMBEDDINGS),
    ("covid_wilk", "genept_embeddings", KEEP_COLS_EMBEDDINGS),
    ("covid_wilk", "genept_projected", KEEP_COLS_PROJECTED),
]


def downsample(path: Path, sample_size: int, seed: int, keep_cols: list[str]) -> None:
    table = pq.read_table(path)
    original_rows = table.num_rows
    original_cols = len(table.column_names)
    original_size = path.stat().st_size

    # Drop embedding columns — keep only what the API serves
    available = [c for c in keep_cols if c in table.column_names]
    table = table.select(available)

    # Sample rows
    if sample_size > 0 and original_rows > sample_size:
        rng = random.Random(seed)
        indices = sorted(rng.sample(range(original_rows), k=sample_size))
        table = table.take(indices)

    pq.write_table(table, path)
    new_size = path.stat().st_size

    print(
        f"  ✅ {path.name}: {original_rows:,} → {table.num_rows:,} rows"
        f"  |  {original_cols} → {len(available)} cols"
        f"  |  {original_size / 1e6:.1f} MB → {new_size / 1e6:.1f} MB"
    )


def main() -> None:
    for dataset, artifact, keep_cols in TARGETS:
        path = DATA_DIR / dataset / f"{artifact}.parquet"
        if not path.exists():
            print(f"  ❌ {path} not found — skipping")
            continue
        downsample(path, SAMPLE_SIZE, SEED, keep_cols)


if __name__ == "__main__":
    main()
