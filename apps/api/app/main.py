import json
from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from .config import settings
from .database import Base, Database
from .models import Club, ClubSeason, Competition, DataSource, MethodologyVersion, Player, PlayerScoreSnapshot, PlayerSeason
from .schemas import DataSourceOut, DerivedScoresOut, OfficialMetricOut, OverviewOut, PlayerOut, PlayerPage, RankedPlayer, RecruitmentRequest, TeamOut
from .scoring import ROLE_PROFILES
from .seed import SCORING_VERSION, seed_sample_data


def create_app(database_url: str | None = None, should_seed: bool | None = None) -> FastAPI:
    database = Database(database_url or settings.database_url)
    seed_enabled = settings.seed_sample_data if should_seed is None else should_seed

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        Base.metadata.create_all(database.engine)
        if seed_enabled:
            with database.session_factory() as db:
                seed_sample_data(db)
        yield

    app = FastAPI(title="J-Scout API", version="0.1.0", lifespan=lifespan)
    app.state.database = database
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

    @app.middleware("http")
    async def security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    def get_db():
        yield from database.session()

    def player_out(player: Player, season: PlayerSeason) -> PlayerOut:
        official_metrics: dict[str, OfficialMetricOut] = {}
        for metric in season.metric_values:
            value = float(metric.value) if metric.value is not None else None
            if value is None or metric.unit == "percent":
                per90 = None
            elif metric.unit == "per90":
                per90 = value
            else:
                per90 = value * 90 / season.minutes if season.minutes > 0 else None
            official_metrics[metric.metric_key] = OfficialMetricOut(
                value=value,
                unit=metric.unit,
                per90=round(per90, 4) if per90 is not None else None,
                listing_status=metric.listing_status,
                source_rank=metric.source_rank,
                source_url=metric.source_url,
                retrieved_at=metric.retrieved_at,
            )
        score = next(
            (
                item
                for item in season.score_snapshots
                if item.methodology_version == SCORING_VERSION
            ),
            None,
        )
        limitations = []
        if season.position == "GK":
            limitations.append("Clean-sheet rate is influenced by team defending.")
        if score and score.status == "not_scored":
            limitations.extend([
                "Development is an age-runway proxy until official role metrics are available.",
                "The final Recruitment Value Proxy remains unavailable without role performance.",
            ])
        derived_scores = DerivedScoresOut(
            status=score.status if score else "not_scored",
            role_performance=float(score.role_performance) if score and score.role_performance is not None else None,
            opportunity=float(score.opportunity) if score and score.opportunity is not None else None,
            development=float(score.development) if score and score.development is not None else None,
            availability=float(score.availability) if score and score.availability is not None else None,
            confidence=float(score.confidence) if score and score.confidence is not None else None,
            value_proxy=float(score.value_proxy) if score and score.value_proxy is not None else None,
            methodology_version=score.methodology_version if score else SCORING_VERSION,
            metrics_used=json.loads(score.metrics_used) if score else [],
            metrics_unavailable=json.loads(score.metrics_unavailable) if score else [],
            reasons=json.loads(score.reasons) if score else ["score_snapshot_unavailable"],
            limitations=limitations,
        )
        return PlayerOut(
            id=season.id,
            source_player_id=player.source_player_id,
            name=player.name,
            name_ja=player.name_ja,
            club_id=season.club_id,
            club_name=season.club.name,
            age=2025 - player.birth_year,
            position=season.position,
            role=season.role,
            minutes=season.minutes,
            appearances=season.appearances,
            goals=season.goals,
            jersey_number=season.jersey_number,
            birth_date=player.birth_date,
            height_cm=player.height_cm,
            weight_kg=player.weight_kg,
            performance=season.performance,
            potential=season.potential,
            opportunity=season.opportunity,
            availability=season.availability,
            coverage=season.coverage,
            official_metrics=official_metrics,
            derived_scores=derived_scores,
        )

    @app.get("/api/v1/health")
    def health(db: Session = Depends(get_db)):
        db.execute(select(1))
        return {"status": "ok", "database": "connected"}

    @app.get("/api/v1/league/2025/overview", response_model=OverviewOut)
    def overview(db: Session = Depends(get_db)):
        competition = db.scalar(select(Competition).where(Competition.code == "J1"))
        methodology = db.scalar(select(MethodologyVersion).order_by(MethodologyVersion.id.desc()))
        if not competition or not methodology:
            raise HTTPException(status_code=404, detail="J1 2025 dataset not found")
        team_stats = db.execute(select(func.count(ClubSeason.id), func.avg(ClubSeason.coverage), func.max(ClubSeason.snapshot_date)).where(ClubSeason.competition_id == competition.id, ClubSeason.season == 2025)).one()
        player_stats = db.execute(select(func.count(PlayerSeason.id), func.avg(PlayerSeason.coverage)).where(PlayerSeason.competition_id == competition.id, PlayerSeason.season == 2025)).one()
        return OverviewOut(competition=competition.code, season=2025, snapshot_date=team_stats[2] or date(2025, 1, 1), methodology_version=methodology.version, sample=False, team_count=team_stats[0], player_count=player_stats[0], average_team_coverage=round(float(team_stats[1] or 0), 1), average_player_coverage=round(float(player_stats[1] or 0), 1))

    @app.get("/api/v1/teams", response_model=list[TeamOut])
    def teams(season: int = 2025, db: Session = Depends(get_db)):
        rows = db.execute(select(Club, ClubSeason).join(ClubSeason, ClubSeason.club_id == Club.id).where(ClubSeason.season == season).order_by(ClubSeason.rank)).all()
        return [TeamOut(id=club.id, slug=club.slug, name=club.name, name_ja=club.name_ja, short_name=club.short_name, rank=item.rank, played=item.played, wins=item.wins, draws=item.draws, losses=item.losses, points=item.points, goals_for=item.goals_for, goals_against=item.goals_against, expected_goals=float(item.expected_goals) if item.expected_goals is not None else None, expected_goals_against=float(item.expected_goals_against) if item.expected_goals_against is not None else None, possession_pct=float(item.possession_pct) if item.possession_pct is not None else None, defensive_actions_per90=float(item.defensive_actions_per90) if item.defensive_actions_per90 is not None else None, consistency=item.consistency, coverage=item.coverage) for club, item in rows]

    def player_query(season: int, position: str | None, min_minutes: int, after_id: int | None):
        statement = select(Player, PlayerSeason).join(PlayerSeason).options(
            joinedload(PlayerSeason.club),
            selectinload(PlayerSeason.metric_values),
            selectinload(PlayerSeason.score_snapshots),
        ).where(PlayerSeason.season == season, PlayerSeason.minutes >= min_minutes)
        if position:
            statement = statement.where(PlayerSeason.position == position)
        if after_id:
            statement = statement.where(PlayerSeason.id > after_id)
        return statement.order_by(PlayerSeason.id)

    @app.get("/api/v1/players", response_model=PlayerPage)
    def players(season: int = 2025, position: str | None = None, min_minutes: int = Query(0, ge=0), after_id: int | None = Query(None, ge=1), limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
        rows = db.execute(player_query(season, position, min_minutes, after_id).limit(limit + 1)).all()
        page_rows = rows[:limit]
        return PlayerPage(items=[player_out(player, item) for player, item in page_rows], next_cursor=page_rows[-1][1].id if len(rows) > limit else None)

    @app.get("/api/v1/players/compare", response_model=list[PlayerOut])
    def compare(ids: str, db: Session = Depends(get_db)):
        player_season_ids = [int(value) for value in ids.split(",") if value.isdigit()]
        if not 2 <= len(player_season_ids) <= 5:
            raise HTTPException(status_code=422, detail="provide between two and five numeric player ids")
        rows = db.execute(select(Player, PlayerSeason).join(PlayerSeason).options(
            joinedload(PlayerSeason.club),
            selectinload(PlayerSeason.metric_values),
            selectinload(PlayerSeason.score_snapshots),
        ).where(PlayerSeason.id.in_(player_season_ids), PlayerSeason.season == 2025)).all()
        return [player_out(player, item) for player, item in rows]

    def ranked_players(payload: RecruitmentRequest, db: Session) -> list[RankedPlayer]:
        statement = player_query(2025, payload.position, payload.minimum_minutes, None).join(
            PlayerScoreSnapshot,
            PlayerScoreSnapshot.player_season_id == PlayerSeason.id,
        ).where(
            PlayerScoreSnapshot.methodology_version == SCORING_VERSION,
            PlayerScoreSnapshot.status == "scored",
        )
        rows = db.execute(statement).all()
        weights = payload.weights
        ranked: list[RankedPlayer] = []
        for player, season in rows:
            score = next(
                item
                for item in season.score_snapshots
                if item.methodology_version == SCORING_VERSION
            )
            values = {
                "role_performance": float(score.role_performance or 0),
                "opportunity": float(score.opportunity or 0),
                "development": float(score.development or 0),
                "availability": float(score.availability or 0),
                "confidence": float(score.confidence or 0),
            }
            weighted = {
                key: values[key] * getattr(weights, key) / 100
                for key in values
            }
            ranked.append(RankedPlayer(
                player=player_out(player, season),
                score=round(sum(weighted.values()), 2),
                components=values,
                methodology_version=score.methodology_version,
            ))
        return sorted(
            ranked,
            key=lambda item: (
                -item.score,
                -item.components["confidence"],
                -item.player.minutes,
                item.player.id,
            ),
        )[:payload.limit]

    @app.post("/api/v1/recruitment/rank", response_model=list[RankedPlayer])
    def recruitment_rank(payload: RecruitmentRequest, db: Session = Depends(get_db)):
        return ranked_players(payload, db)

    @app.post("/api/v1/moneyball/rank", response_model=list[RankedPlayer])
    def moneyball_compatibility(
        payload: RecruitmentRequest,
        response: Response,
        db: Session = Depends(get_db),
    ):
        response.headers["Deprecation"] = "true"
        response.headers["Link"] = '</api/v1/recruitment/rank>; rel="successor-version"'
        return ranked_players(payload, db)

    @app.get("/api/v1/methodology")
    def methodology(db: Session = Depends(get_db)):
        current = db.scalar(select(MethodologyVersion).order_by(MethodologyVersion.id.desc()))
        if not current:
            raise HTTPException(status_code=404, detail="methodology not found")
        return {
            "version": SCORING_VERSION,
            "description": current.description,
            "formula": {
                "role_performance": 50,
                "opportunity": 20,
                "development": 15,
                "availability": 10,
                "confidence": 5,
            },
            "role_profiles": {
                position: [
                    {"metric": item.key, "weight": round(item.weight * 100), "per90": item.use_per90}
                    for item in profile
                ]
                for position, profile in ROLE_PROFILES.items()
            },
            "eligibility": {"default_minimum_minutes": 900, "discovery_minimum_minutes": 450},
            "missing_data": {
                "minimum_profile_weight": 60,
                "not_listed_is_zero": False,
                "partial_components": [
                    "opportunity",
                    "development",
                    "availability",
                    "confidence",
                ],
            },
            "limitations": [
                "Advanced J STATS values remain unavailable until usage permission is approved.",
                "Development is age-runway only when role performance is unavailable.",
                "Partial components never produce a final proxy without role performance.",
                "The proxy is not a transfer valuation or scouting verdict.",
                "Clean sheets and several defensive outcomes are influenced by team context.",
                "Human and video review remain required.",
            ],
        }

    @app.get("/api/v1/data-coverage", response_model=list[DataSourceOut])
    def data_coverage(db: Session = Depends(get_db)):
        return list(db.scalars(select(DataSource).order_by(DataSource.id)))

    return app


app = create_app()
