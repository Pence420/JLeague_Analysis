from decimal import Decimal
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Player, PlayerMetricValue, PlayerScoreSnapshot, PlayerSeason
from app.seed import seed_database


API_ROOT = Path(__file__).resolve().parents[1]


def snapshot() -> dict:
    return {
        "competition": "J1",
        "season": 2025,
        "snapshotDate": "2025-12-06",
        "methodologyVersion": "jleague-official-2025.3",
        "provenance": {
            "standingsUrl": "https://example.test/standings",
            "playerDirectoryUrl": "https://example.test/players",
        },
        "teams": [
            {
                "id": "kashima", "name": "Kashima Antlers", "nameJa": "鹿島",
                "shortName": "KAS", "rank": 1, "played": 38, "wins": 23,
                "draws": 7, "losses": 8, "points": 76, "goalsFor": 58,
                "goalsAgainst": 31, "coverage": 100,
            },
            {
                "id": "kashiwa", "name": "Kashiwa Reysol", "nameJa": "柏",
                "shortName": "KSW", "rank": 2, "played": 38, "wins": 21,
                "draws": 12, "losses": 5, "points": 75, "goalsFor": 60,
                "goalsAgainst": 34, "coverage": 100,
            },
        ],
        "players": [
            {
                "id": "123-kashima", "officialPlayerId": "123", "name": "TRANSFER Player",
                "nameJa": "移籍 選手", "teamId": "kashima", "position": "MF",
                "role": "Midfielder", "birthDate": "2000/01/01", "heightCm": 180,
                "weightKg": 72, "minutes": 900, "appearances": 10, "goals": 1,
                "jerseyNumber": 8, "coverage": 100,
                "officialMetrics": {
                    "assists": {"value": 0, "unit": "count", "listingStatus": "listed", "sourceRank": 200, "sourceUrl": "https://example.test/assists", "retrievedAt": "2025-12-06T00:00:00+00:00"},
                    "tackles": {"value": None, "unit": "count", "listingStatus": "not_listed", "sourceRank": None, "sourceUrl": "https://example.test/tackles", "retrievedAt": "2025-12-06T00:00:00+00:00"},
                },
            },
            {
                "id": "123-kashiwa", "officialPlayerId": "123", "name": "TRANSFER Player",
                "nameJa": "移籍 選手", "teamId": "kashiwa", "position": "MF",
                "role": "Midfielder", "birthDate": "2000/01/01", "heightCm": 180,
                "weightKg": 72, "minutes": 800, "appearances": 9, "goals": 0,
                "jerseyNumber": 18, "coverage": 100, "officialMetrics": {},
            },
        ],
    }


def test_seed_preserves_zero_null_and_transfer_identity() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        seed_database(session, snapshot())

        assert session.scalar(select(func.count(Player.id))) == 1
        assert session.scalar(select(func.count(PlayerSeason.id))) == 2
        assert session.scalar(select(func.count(PlayerScoreSnapshot.id))) == 2
        player = session.scalar(select(Player).where(Player.source_player_id == "123"))
        assert player is not None
        assert {season.club.slug for season in player.seasons} == {"kashima", "kashiwa"}

        zero = session.scalar(
            select(PlayerMetricValue).where(
                PlayerMetricValue.metric_key == "assists",
                PlayerMetricValue.listing_status == "listed",
            )
        )
        missing = session.scalar(
            select(PlayerMetricValue).where(
                PlayerMetricValue.metric_key == "tackles",
                PlayerMetricValue.listing_status == "not_listed",
            )
        )
        assert zero is not None and zero.value == Decimal("0.0000")
        assert missing is not None and missing.value is None


def test_seed_is_idempotent() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        seed_database(session, snapshot())
        first_counts = (
            session.scalar(select(func.count(Player.id))),
            session.scalar(select(func.count(PlayerSeason.id))),
            session.scalar(select(func.count(PlayerMetricValue.id))),
            session.scalar(select(func.count(PlayerScoreSnapshot.id))),
        )
        seed_database(session, snapshot())
        second_counts = (
            session.scalar(select(func.count(Player.id))),
            session.scalar(select(func.count(PlayerSeason.id))),
            session.scalar(select(func.count(PlayerMetricValue.id))),
            session.scalar(select(func.count(PlayerScoreSnapshot.id))),
        )

    assert second_counts == first_counts


def test_sqlite_migrations_create_seedable_primary_keys(tmp_path, monkeypatch) -> None:
    database_url = f"sqlite+pysqlite:///{tmp_path / 'migrated.db'}"
    monkeypatch.delenv("DATABASE_URL", raising=False)
    config = Config(str(API_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(API_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    with Session(engine) as session:
        seed_database(session, snapshot())
        assert session.scalar(select(func.count(Player.id))) == 1
        assert session.scalar(select(func.count(PlayerSeason.id))) == 2
