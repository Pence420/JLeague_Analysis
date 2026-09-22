from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://jscout_app:jscout_local@127.0.0.1:5432/jscout",
    )
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000").split(",")
        if origin.strip()
    )
    seed_sample_data: bool = os.getenv("SEED_SAMPLE_DATA", "true").lower() == "true"


settings = Settings()
