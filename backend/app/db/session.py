# Async SQLAlchemy engine and FastAPI dependency yielding an AsyncSession per request.

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

from app.core.config import get_settings

settings = get_settings()

# statement_cache_size=0 disables asyncpg's prepared-statement cache, required for
# Neon's PgBouncer transaction-mode pooling. Only passed for the asyncpg dialect so
# the engine can be safely imported in non-asyncpg contexts (e.g. SQLite tests).
_connect_args: dict[str, int] = {}
if settings.database_url.startswith("postgresql+asyncpg"):
    _connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=_connect_args,
)
async_session_maker = async_sessionmaker(
    engine,
    class_=SQLModelAsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncIterator[SQLModelAsyncSession]:
    """Yield a request-scoped async ORM session."""

    async with async_session_maker() as session:
        yield session
