# Idempotent upsert of PrecomputeRun rows for covid_wilk (geneformer + genept).

import asyncio
import logging
import sys

from sqlmodel import select

from app.db.models import Dataset, PrecomputeRun
from app.db.session import async_session_maker

logger = logging.getLogger(__name__)

_DATASET_SLUG = "covid_wilk"
_GIT_SHA = "828d1c7"

_RUNS: list[dict[str, str]] = [
    {
        "model_name": "geneformer",
        "model_version": "1.0.0",
        "output_parquet_key": "v1/covid_wilk/geneformer_embeddings.parquet",
    },
    {
        "model_name": "genept",
        "model_version": "1.0.0",
        "output_parquet_key": "v1/covid_wilk/genept_embeddings.parquet",
    },
]


async def main() -> None:
    """Upsert PrecomputeRun rows; safe to run multiple times."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    async with async_session_maker() as session:
        ds_result = await session.exec(select(Dataset).where(Dataset.slug == _DATASET_SLUG))
        dataset = ds_result.first()
        if dataset is None or dataset.id is None:
            logger.error("Dataset %r not found — run seed_covid_dataset.py first", _DATASET_SLUG)
            sys.exit(1)

        for run_spec in _RUNS:
            existing = await session.exec(
                select(PrecomputeRun)
                .where(PrecomputeRun.dataset_id == dataset.id)
                .where(PrecomputeRun.model_name == run_spec["model_name"])
            )
            row = existing.first()
            if row is None:
                row = PrecomputeRun(
                    dataset_id=dataset.id,
                    model_name=run_spec["model_name"],
                    model_version=run_spec["model_version"],
                    output_parquet_key=run_spec["output_parquet_key"],
                    git_sha=_GIT_SHA,
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)
                logger.info("seeded %s run id=%s", run_spec["model_name"], row.id)
            else:
                row.output_parquet_key = run_spec["output_parquet_key"]
                row.model_version = run_spec["model_version"]
                row.git_sha = _GIT_SHA
                session.add(row)
                await session.commit()
                await session.refresh(row)
                logger.info("updated %s run id=%s", run_spec["model_name"], row.id)
            print(f"seeded {run_spec['model_name']} run id={row.id}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        logger.exception("seed_precompute_runs failed")
        sys.exit(1)
