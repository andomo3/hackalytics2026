from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./safetransit.db")


def ensure_sqlite_path(database_url: str) -> None:
    url = make_url(database_url)
    if url.get_backend_name() != "sqlite":
        return

    database_path = url.database
    if not database_path or database_path == ":memory:":
        return

    absolute_path = Path(database_path)
    if not absolute_path.is_absolute():
        absolute_path = Path.cwd() / absolute_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)


ensure_sqlite_path(DATABASE_URL)

engine = create_async_engine(DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
