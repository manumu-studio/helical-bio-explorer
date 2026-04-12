# Idempotent upsert of childhood cSLE (GSE135779) dataset row into ``datasets`` (Neon / Postgres).

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
    """Upsert the sle_csle registry row; safe to run multiple times."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    async with async_session_maker() as session:
        existing = await session.exec(select(Dataset).where(Dataset.slug == "sle_csle"))
        had_row = existing.first() is not None

        row_id = uuid.uuid4()
        stmt = insert(Dataset).values(
            id=row_id,
            slug="sle_csle",
            display_name="Childhood SLE (Banchereau et al.)",
            citation="Banchereau et al., Nature Immunology, 2020",
            license="GEO public access",
            cell_count=276000,
            gene_count=0,
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
            logger.info("updated: sle_csle")
        else:
            logger.info("seeded: sle_csle")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        logger.exception("seed_sle_dataset failed")
        sys.exit(1)
