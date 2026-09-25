import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    Club,
    ClubSeason,
    Competition,
    DataSource,
    MethodologyVersion,
    Player,
    PlayerMetricValue,
    PlayerScoreSnapshot,
    PlayerSeason,
)
from .scoring import PlayerScoringInput, ScoringMetric, calculate_score


SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "data" / "jleague" / "2025.json"
SCORING_VERSION = "jleague-official-2025.3"


def _set(instance, **values) -> None:
    for key, value in values.items():
        setattr(instance, key, value)


def _upsert_data_source(db: Session, *, name: str, status: str, coverage: int, notes: str) -> None:
    source = db.scalar(select(DataSource).where(DataSource.name == name))
    if source is None:
        source = DataSource(name=name, status=status, coverage=coverage, notes=notes)
        db.add(source)
    else:
        _set(source, status=status, coverage=coverage, notes=notes)


def _refresh_scores(db: Session, *, competition_id: int, season: int) -> None:
    db.flush()
    season_rows = db.execute(
        select(PlayerSeason, Player)
        .join(Player, Player.id == PlayerSeason.player_id)
        .where(
            PlayerSeason.competition_id == competition_id,
            PlayerSeason.season == season,
        )
    ).all()
    metric_rows = list(db.scalars(
        select(PlayerMetricValue).join(PlayerSeason).where(
            PlayerSeason.competition_id == competition_id,
            PlayerSeason.season == season,
        )
    ))
    metrics_by_season: dict[int, dict[str, ScoringMetric]] = {}
    for item in metric_rows:
        player_season = next(row[0] for row in season_rows if row[0].id == item.player_season_id)
        numeric = float(item.value) if item.value is not None else None
        per90 = numeric * 90 / player_season.minutes if numeric is not None and player_season.minutes > 0 else None
        metrics_by_season.setdefault(item.player_season_id, {})[item.metric_key] = ScoringMetric(
            value=numeric,
            per90=per90,
            listing_status=item.listing_status,
        )
    max_minutes_by_club = {
        club_id: played * 90
        for club_id, played in db.execute(
            select(ClubSeason.club_id, ClubSeason.played).where(
                ClubSeason.competition_id == competition_id,
                ClubSeason.season == season,
            )
        )
    }
    scoring_inputs = [
        PlayerScoringInput(
            player_id=str(player_season.id),
            position=player_season.position,
            minutes=player_season.minutes,
            age=season - player.birth_year,
            max_minutes=max_minutes_by_club.get(player_season.club_id, 38 * 90),
            metrics=metrics_by_season.get(player_season.id, {}),
            appearances=player_season.appearances,
            data_coverage=player_season.coverage,
        )
        for player_season, player in season_rows
    ]
    for scoring_input in scoring_inputs:
        result = calculate_score(scoring_input, scoring_inputs, minimum_minutes=450)
        player_season_id = int(scoring_input.player_id)
        score = db.scalar(select(PlayerScoreSnapshot).where(
            PlayerScoreSnapshot.player_season_id == player_season_id,
            PlayerScoreSnapshot.methodology_version == SCORING_VERSION,
        ))
        values = {
            "status": result.status,
            "role_performance": result.role_performance,
            "opportunity": result.opportunity,
            "development": result.development,
            "availability": result.availability,
            "confidence": result.confidence,
            "value_proxy": result.value_proxy,
            "metrics_used": json.dumps(result.metrics_used),
            "metrics_unavailable": json.dumps(result.metrics_unavailable),
            "reasons": json.dumps([result.reason] if result.reason else []),
        }
        if score is None:
            db.add(PlayerScoreSnapshot(
                player_season_id=player_season_id,
                methodology_version=SCORING_VERSION,
                **values,
            ))
        else:
            _set(score, **values)


def seed_database(db: Session, snapshot: dict) -> None:
    """Idempotently load one immutable snapshot into normalized records."""

    competition_code = snapshot.get("competition", "J1")
    season = int(snapshot["season"])
    competition = db.scalar(select(Competition).where(Competition.code == competition_code))
    if competition is None:
        competition = Competition(
            code=competition_code,
            name=f"Meiji Yasuda J1 League {season}",
            country_code="JP",
        )
        db.add(competition)
        db.flush()

    clubs: dict[str, Club] = {}
    for team in snapshot["teams"]:
        club = db.scalar(select(Club).where(Club.slug == team["id"]))
        if club is None:
            club = Club(
                slug=team["id"],
                name=team["name"],
                name_ja=team["nameJa"],
                short_name=team["shortName"],
            )
            db.add(club)
            db.flush()
        else:
            _set(club, name=team["name"], name_ja=team["nameJa"], short_name=team["shortName"])
        clubs[team["id"]] = club

        club_season = db.scalar(
            select(ClubSeason).where(
                ClubSeason.competition_id == competition.id,
                ClubSeason.club_id == club.id,
                ClubSeason.season == season,
            )
        )
        club_values = {
            "rank": team["rank"], "played": team["played"], "wins": team["wins"],
            "draws": team["draws"], "losses": team["losses"], "points": team["points"],
            "goals_for": team["goalsFor"], "goals_against": team["goalsAgainst"],
            "expected_goals": team.get("expectedGoals"),
            "expected_goals_against": team.get("expectedGoalsAgainst"),
            "possession_pct": team.get("possessionPct"),
            "defensive_actions_per90": team.get("defensiveActionsPer90"),
            "consistency": team.get("consistency"), "coverage": team["coverage"],
            "snapshot_date": date.fromisoformat(snapshot["snapshotDate"]),
        }
        if club_season is None:
            db.add(ClubSeason(
                competition_id=competition.id, club_id=club.id, season=season, **club_values
            ))
        else:
            _set(club_season, **club_values)

    for item in snapshot["players"]:
        official_player_id = str(item.get("officialPlayerId") or item["id"])
        player = db.scalar(select(Player).where(Player.source_player_id == official_player_id))
        identity_values = {
            "name": item["name"], "name_ja": item["nameJa"],
            "birth_year": int(item["birthDate"][:4]),
            "birth_date": date.fromisoformat(item["birthDate"].replace("/", "-")),
            "height_cm": item.get("heightCm"), "weight_kg": item.get("weightKg"),
        }
        if player is None:
            player = Player(source_player_id=official_player_id, **identity_values)
            db.add(player)
            db.flush()
        else:
            _set(player, **identity_values)

        club = clubs[item["teamId"]]
        player_season = db.scalar(
            select(PlayerSeason).where(
                PlayerSeason.player_id == player.id,
                PlayerSeason.club_id == club.id,
                PlayerSeason.competition_id == competition.id,
                PlayerSeason.season == season,
            )
        )
        season_values = {
            "position": item["position"], "role": item["role"], "minutes": item["minutes"],
            "appearances": item["appearances"], "goals": item["goals"],
            "jersey_number": item["jerseyNumber"], "performance": item.get("performance"),
            "potential": item.get("potential"), "opportunity": item.get("opportunity"),
            "availability": item.get("availability"), "coverage": item["coverage"],
        }
        if player_season is None:
            player_season = PlayerSeason(
                player_id=player.id, club_id=club.id, competition_id=competition.id,
                season=season, **season_values,
            )
            db.add(player_season)
            db.flush()
        else:
            _set(player_season, **season_values)

        for metric_key, metric in item.get("officialMetrics", {}).items():
            metric_value = db.scalar(
                select(PlayerMetricValue).where(
                    PlayerMetricValue.player_season_id == player_season.id,
                    PlayerMetricValue.metric_key == metric_key,
                )
            )
            metric_values = {
                "value": Decimal(str(metric["value"])) if metric.get("value") is not None else None,
                "unit": metric["unit"], "listing_status": metric["listingStatus"],
                "source_rank": metric.get("sourceRank"), "source_url": metric["sourceUrl"],
                "retrieved_at": datetime.fromisoformat(metric["retrievedAt"]),
            }
            if metric_value is None:
                db.add(PlayerMetricValue(
                    player_season_id=player_season.id, metric_key=metric_key, **metric_values
                ))
            else:
                _set(metric_value, **metric_values)

    _refresh_scores(db, competition_id=competition.id, season=season)

    methodology_version = SCORING_VERSION
    methodology = db.scalar(
        select(MethodologyVersion).where(MethodologyVersion.version == methodology_version)
    )
    if methodology is None:
        db.add(MethodologyVersion(
            version=methodology_version,
            description=(
                "Official J.LEAGUE 2025 identity and appearance records. "
                "All J-Scout recruitment scores are explicitly derived."
            ),
        ))

    provenance = snapshot.get("provenance", {})
    _upsert_data_source(db, name="J.LEAGUE final standings", status="enabled", coverage=100, notes=provenance.get("standingsUrl", ""))
    _upsert_data_source(db, name="J.LEAGUE player appearance records", status="enabled", coverage=100, notes="Official team-by-team appearance, minutes and goals records.")
    _upsert_data_source(db, name="J STATS advanced player metrics", status="research_only", coverage=0, notes="Schema and parser are ready; bulk values are gated pending usage approval.")
    _upsert_data_source(db, name="Market values", status="unavailable", coverage=0, notes="No market-value claims are made.")
    db.commit()


def seed_sample_data(db: Session) -> None:
    """Load the checked-in snapshot (legacy public name kept for compatibility)."""

    snapshot = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    seed_database(db, snapshot)
