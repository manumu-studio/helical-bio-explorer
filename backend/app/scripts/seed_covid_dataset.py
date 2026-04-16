# Idempotent upsert of Wilk COVID (``covid_wilk``) dataset row — PACKET-02c registry seed.

import asyncio
import logging
import sys

from sqlmodel import select

from app.db.models import Dataset
from app.db.session import async_session_maker

logger = logging.getLogger(__name__)

_COVID_SLUG = "covid_wilk"
_DISPLAY_NAME = "COVID-19 PBMCs (Wilk et al.)"
_CITATION = "Wilk AJ et al., Nature Medicine, 2020"
_LICENSE = "CELLxGENE public access"
_CELL_COUNT = 10000
_GENE_COUNT = 0


async def main() -> None:
    """Upsert the COVID Wilk registry row; safe to run multiple times."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    async with async_session_maker() as session:
        result = await session.exec(select(Dataset).where(Dataset.slug == _COVID_SLUG))
        row = result.first()
        if row is None:
            row = Dataset(
                slug=_COVID_SLUG,
                display_name=_DISPLAY_NAME,
                citation=_CITATION,
                license=_LICENSE,
                cell_count=_CELL_COUNT,
                gene_count=_GENE_COUNT,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            logger.info("seeded covid_wilk id=%s", row.id)
        else:
            row.display_name = _DISPLAY_NAME
            row.citation = _CITATION
            row.license = _LICENSE
            row.cell_count = _CELL_COUNT
            row.gene_count = _GENE_COUNT
            session.add(row)
            await session.commit()
            await session.refresh(row)
            logger.info("updated covid_wilk id=%s", row.id)
        print(f"seeded covid_wilk id={row.id}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        logger.exception("seed_covid_dataset failed")
        sys.exit(1)
