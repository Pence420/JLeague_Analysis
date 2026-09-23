import json
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Club, ClubSeason, Competition, DataSource, MethodologyVersion, Player, PlayerSeason


SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "data" / "jleague" / "2025.json"


def seed_sample_data(db: Session) -> None:
    """Seed the immutable official snapshot (legacy function name kept for compatibility)."""
    if db.scalar(select(Competition.id).where(Competition.code == "J1").limit(1)) is not None:
        return
    snapshot = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    competition = Competition(code="J1", name="Meiji Yasuda J1 League 2025", country_code="JP")
    db.add(competition)
    db.flush()
    clubs: dict[str, Club] = {}
    for team in snapshot["teams"]:
        club = Club(slug=team["id"], name=team["name"], name_ja=team["nameJa"], short_name=team["shortName"])
        db.add(club)
        db.flush()
        clubs[team["id"]] = club
        db.add(ClubSeason(
            competition_id=competition.id, club_id=club.id, season=2025,
            rank=team["rank"], played=team["played"], wins=team["wins"], draws=team["draws"], losses=team["losses"],
            points=team["points"], goals_for=team["goalsFor"], goals_against=team["goalsAgainst"],
            expected_goals=None, expected_goals_against=None, possession_pct=None,
            defensive_actions_per90=None, consistency=None, coverage=team["coverage"],
            snapshot_date=date.fromisoformat(snapshot["snapshotDate"]),
        ))
    for item in snapshot["players"]:
        player = Player(
            source_player_id=item["id"], name=item["name"], name_ja=item["nameJa"],
            club_id=clubs[item["teamId"]].id, birth_year=int(item["birthDate"][:4]),
            birth_date=date.fromisoformat(item["birthDate"].replace("/", "-")),
            height_cm=item["heightCm"], weight_kg=item["weightKg"],
        )
        db.add(player)
        db.flush()
        db.add(PlayerSeason(
            player_id=player.id, competition_id=competition.id, season=2025,
            position=item["position"], role=item["role"], minutes=item["minutes"],
            appearances=item["appearances"], goals=item["goals"], jersey_number=item["jerseyNumber"],
            performance=item["performance"], potential=item["potential"], opportunity=item["opportunity"],
            availability=item["availability"], coverage=item["coverage"],
        ))
    db.add(MethodologyVersion(
        version=snapshot["methodologyVersion"],
        description="Official J.LEAGUE 2025 standings and player appearance records. All J-Scout scores are explicitly derived.",
    ))
    db.add_all([
        DataSource(name="J.LEAGUE final standings", status="enabled", coverage=100, notes=snapshot["provenance"]["standingsUrl"]),
        DataSource(name="J.LEAGUE player appearance records", status="enabled", coverage=100, notes="Official team-by-team 2025 appearance, minutes and goals records."),
        DataSource(name="Event coordinates and xG", status="unavailable", coverage=0, notes="Claims requiring event data remain disabled."),
        DataSource(name="Market values", status="unavailable", coverage=0, notes="No market-value claims are made."),
    ])
    db.commit()
