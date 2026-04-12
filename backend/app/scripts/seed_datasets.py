# Idempotent upsert of canonical PBMC 3k dataset row into ``datasets`` (Neon / Postgres).

import asyncio
import logging
import sys
import uuid

from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select

from app.db.models import Dataset
from app.db.session import async_session_maker

logger = logging.getLogger(__name__)


async def main() -> None:
    """Upsert the PBMC 3k registry row; safe to run multiple times."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    async with async_session_maker() as session:
        existing = await session.exec(select(Dataset).where(Dataset.slug == "pbmc3k"))
        had_row = existing.first() is not None

        row_id = uuid.uuid4()
        stmt = insert(Dataset).values(
            id=row_id,
            slug="pbmc3k",
            display_name="PBMC 3k (healthy reference)",
            citation="10x Genomics, 2016",
            license="CC BY 4.0",
            cell_count=2638,
            gene_count=13714,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["slug"],
            set_={
                "display_name": stmt.excluded.display_name,
                "citation": stmt.excluded.citation,
                "license": stmt.excluded.license,
                "cell_count": stmt.excluded.cell_count,
                "gene_count": stmt.excluded.gene_count,
            },
        )
        await session.execute(stmt)
        await session.commit()

        if had_row:
            logger.info("updated: pbmc3k")
        else:
            logger.info("seeded: pbmc3k")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        logger.exception("seed_datasets failed")
        sys.exit(1)
