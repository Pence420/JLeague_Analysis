from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Competition(Base):
    __tablename__ = "competitions"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    country_code: Mapped[str] = mapped_column(String(2))


class Club(Base):
    __tablename__ = "clubs"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    name_ja: Mapped[str] = mapped_column(String(160), default="")
    short_name: Mapped[str] = mapped_column(String(12))
    player_seasons: Mapped[list["PlayerSeason"]] = relationship(back_populates="club")


class ClubSeason(Base):
    __tablename__ = "club_seasons"
    __table_args__ = (
        UniqueConstraint("competition_id", "club_id", "season", name="uq_club_season_scope"),
        CheckConstraint("played >= 0", name="ck_club_seasons_played_nonnegative"),
        CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_club_seasons_coverage_range"),
        Index("ix_club_seasons_competition_season", "competition_id", "season"),
        Index("ix_club_seasons_club_id", "club_id"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id", ondelete="CASCADE"))
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"))
    season: Mapped[int] = mapped_column(Integer)
    played: Mapped[int] = mapped_column(Integer)
    rank: Mapped[int] = mapped_column(Integer)
    wins: Mapped[int] = mapped_column(Integer)
    draws: Mapped[int] = mapped_column(Integer)
    losses: Mapped[int] = mapped_column(Integer)
    points: Mapped[int] = mapped_column(Integer)
    goals_for: Mapped[int] = mapped_column(Integer)
    goals_against: Mapped[int] = mapped_column(Integer)
    expected_goals: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
    expected_goals_against: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
    possession_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    defensive_actions_per90: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    consistency: Mapped[int | None] = mapped_column(Integer)
    coverage: Mapped[int] = mapped_column(Integer)
    snapshot_date: Mapped[date] = mapped_column(Date)
    club: Mapped[Club] = relationship()


class Player(Base):
    __tablename__ = "players"
    id: Mapped[int] = mapped_column(primary_key=True)
    source_player_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    name_ja: Mapped[str] = mapped_column(String(160), default="")
    birth_year: Mapped[int] = mapped_column(Integer)
    birth_date: Mapped[date | None] = mapped_column(Date)
    height_cm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[int | None] = mapped_column(Integer)
    seasons: Mapped[list["PlayerSeason"]] = relationship(back_populates="player", cascade="all, delete-orphan")


class PlayerSeason(Base):
    __tablename__ = "player_seasons"
    __table_args__ = (
        UniqueConstraint("player_id", "club_id", "competition_id", "season", name="uq_player_season_scope"),
        CheckConstraint("minutes >= 0", name="ck_player_seasons_minutes_nonnegative"),
        CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_player_seasons_coverage_range"),
        Index("ix_player_seasons_player_id", "player_id"),
        Index("ix_player_seasons_club_id", "club_id"),
        Index("ix_player_seasons_competition_id", "competition_id"),
        Index("ix_player_seasons_filter", "season", "position", "minutes"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"))
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="RESTRICT"))
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id", ondelete="CASCADE"))
    season: Mapped[int] = mapped_column(Integer)
    position: Mapped[str] = mapped_column(String(16))
    role: Mapped[str] = mapped_column(String(120))
    minutes: Mapped[int] = mapped_column(Integer)
    appearances: Mapped[int] = mapped_column(Integer)
    goals: Mapped[int] = mapped_column(Integer)
    jersey_number: Mapped[int] = mapped_column(Integer)
    performance: Mapped[int | None] = mapped_column(Integer)
    potential: Mapped[int | None] = mapped_column(Integer)
    opportunity: Mapped[int | None] = mapped_column(Integer)
    availability: Mapped[int | None] = mapped_column(Integer)
    coverage: Mapped[int] = mapped_column(Integer)
    player: Mapped[Player] = relationship(back_populates="seasons")
    club: Mapped[Club] = relationship(back_populates="player_seasons")
    metric_values: Mapped[list["PlayerMetricValue"]] = relationship(
        back_populates="player_season", cascade="all, delete-orphan"
    )
    score_snapshots: Mapped[list["PlayerScoreSnapshot"]] = relationship(
        back_populates="player_season", cascade="all, delete-orphan"
    )


class PlayerMetricValue(Base):
    __tablename__ = "player_metric_values"
    __table_args__ = (
        UniqueConstraint("player_season_id", "metric_key", name="uq_player_metric_value"),
        CheckConstraint(
            "listing_status IN ('listed', 'not_listed', 'unavailable')",
            name="ck_player_metric_values_listing_status",
        ),
        CheckConstraint(
            "(listing_status = 'listed' AND value IS NOT NULL) OR "
            "(listing_status != 'listed' AND value IS NULL)",
            name="ck_player_metric_values_value_status",
        ),
        Index("ix_player_metric_values_player_season_id", "player_season_id"),
        Index("ix_player_metric_values_metric_key", "metric_key"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    player_season_id: Mapped[int] = mapped_column(
        ForeignKey("player_seasons.id", ondelete="CASCADE")
    )
    metric_key: Mapped[str] = mapped_column(String(80))
    value: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    unit: Mapped[str] = mapped_column(String(32))
    listing_status: Mapped[str] = mapped_column(String(24))
    source_rank: Mapped[int | None] = mapped_column(Integer)
    source_url: Mapped[str] = mapped_column(Text)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    player_season: Mapped[PlayerSeason] = relationship(back_populates="metric_values")


class PlayerScoreSnapshot(Base):
    __tablename__ = "player_score_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "player_season_id", "methodology_version", name="uq_player_score_snapshot"
        ),
        CheckConstraint(
            "status IN ('scored', 'ineligible', 'not_scored')",
            name="ck_player_score_snapshots_status",
        ),
        CheckConstraint(
            "confidence IS NULL OR confidence BETWEEN 0 AND 100",
            name="ck_player_score_snapshots_confidence_range",
        ),
        Index("ix_player_score_snapshots_player_season_id", "player_season_id"),
        Index(
            "ix_player_score_snapshots_methodology_value",
            "methodology_version",
            "value_proxy",
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    player_season_id: Mapped[int] = mapped_column(
        ForeignKey("player_seasons.id", ondelete="CASCADE")
    )
    methodology_version: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(24))
    role_performance: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    opportunity: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    development: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    availability: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    confidence: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    value_proxy: Mapped[Decimal | None] = mapped_column(Numeric(7, 4))
    metrics_used: Mapped[str] = mapped_column(Text, default="[]")
    metrics_unavailable: Mapped[str] = mapped_column(Text, default="[]")
    reasons: Mapped[str] = mapped_column(Text, default="[]")
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    player_season: Mapped[PlayerSeason] = relationship(back_populates="score_snapshots")


class MethodologyVersion(Base):
    __tablename__ = "methodology_versions"
    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DataSource(Base):
    __tablename__ = "data_sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    status: Mapped[str] = mapped_column(String(32))
    coverage: Mapped[int] = mapped_column(Integer)
    notes: Mapped[str] = mapped_column(Text)
