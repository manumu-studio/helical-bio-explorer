# Async SQLAlchemy engine and FastAPI dependency yielding an AsyncSession per request.

import ssl as _ssl_mod
from collections.abc import AsyncIterator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

from app.core.config import get_settings

settings = get_settings()


def _prepare_asyncpg_url(raw_url: str) -> tuple[str, dict[str, object]]:
    """Strip SSL/channel_binding query params and return (clean_url, connect_args).

    asyncpg doesn't accept ``sslmode`` or ``channel_binding`` as keyword args
    when driven through SQLAlchemy. We move ``sslmode`` into ``connect_args``
    as an ``ssl`` context and drop unsupported params so the connection succeeds
    against Neon's pooled endpoint.
    """
    connect_args: dict[str, object] = {"statement_cache_size": 0}
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    # Map sslmode → ssl context
    sslmode = params.pop("sslmode", [None])[0]
    if sslmode and sslmode in ("require", "verify-ca", "verify-full"):
        connect_args["ssl"] = _ssl_mod.create_default_context()

    # Drop params asyncpg doesn't recognise
    params.pop("channel_binding", None)

    clean_query = urlencode({k: v[0] for k, v in params.items()}, doseq=False)
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, connect_args


# Build connect_args conditionally: asyncpg needs SSL + cache tweaks; other
# dialects (e.g. SQLite in tests) get nothing.
_connect_args: dict[str, object] = {}
if settings.database_url.startswith("postgresql+asyncpg"):
    _database_url, _connect_args = _prepare_asyncpg_url(settings.database_url)
else:
    _database_url = settings.database_url

engine = create_async_engine(
    _database_url,
    echo=False,
    connect_args=_connect_args,
    pool_pre_ping=True,
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
