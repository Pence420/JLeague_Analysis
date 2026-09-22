from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


class Database:
    def __init__(self, url: str):
        engine_options: dict = {"pool_pre_ping": True}
        if url.startswith("sqlite"):
            engine_options["connect_args"] = {"check_same_thread": False}
            if ":memory:" in url:
                engine_options["poolclass"] = StaticPool
        else:
            engine_options.update({"pool_size": 5, "max_overflow": 10, "pool_recycle": 1800})
        self.engine = create_engine(url, **engine_options)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)

    def session(self) -> Generator[Session, None, None]:
        db = self.session_factory()
        try:
            yield db
        finally:
            db.close()
