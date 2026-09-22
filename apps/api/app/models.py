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
    short_name: Mapped[str] = mapped_column(String(12))
    players: Mapped[list["Player"]] = relationship(back_populates="club")


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
    __table_args__ = (Index("ix_players_club_id", "club_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    source_player_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="RESTRICT"))
    birth_year: Mapped[int] = mapped_column(Integer)
    club: Mapped[Club] = relationship(back_populates="players")
    seasons: Mapped[list["PlayerSeason"]] = relationship(back_populates="player", cascade="all, delete-orphan")


class PlayerSeason(Base):
    __tablename__ = "player_seasons"
    __table_args__ = (
        UniqueConstraint("player_id", "competition_id", "season", name="uq_player_season_scope"),
        CheckConstraint("minutes >= 0", name="ck_player_seasons_minutes_nonnegative"),
        CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_player_seasons_coverage_range"),
        Index("ix_player_seasons_player_id", "player_id"),
        Index("ix_player_seasons_competition_id", "competition_id"),
        Index("ix_player_seasons_filter", "season", "position", "minutes"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"))
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id", ondelete="CASCADE"))
    season: Mapped[int] = mapped_column(Integer)
    position: Mapped[str] = mapped_column(String(16))
    role: Mapped[str] = mapped_column(String(120))
    minutes: Mapped[int] = mapped_column(Integer)
    performance: Mapped[int | None] = mapped_column(Integer)
    potential: Mapped[int | None] = mapped_column(Integer)
    opportunity: Mapped[int | None] = mapped_column(Integer)
    availability: Mapped[int | None] = mapped_column(Integer)
    coverage: Mapped[int] = mapped_column(Integer)
    player: Mapped[Player] = relationship(back_populates="seasons")


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
