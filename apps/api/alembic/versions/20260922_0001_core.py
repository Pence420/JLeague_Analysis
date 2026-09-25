"""Create the J-Scout core analytics schema."""
from alembic import op
import sqlalchemy as sa

revision = "20260922_0001"
down_revision = None
branch_labels = None
depends_on = None


def _bigint():
    """Keep bigint IDs on Postgres and SQLite-compatible row IDs locally."""
    return sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def upgrade() -> None:
    op.create_table("competitions", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("code", sa.String(16), nullable=False), sa.Column("name", sa.String(120), nullable=False), sa.Column("country_code", sa.String(2), nullable=False), sa.UniqueConstraint("code"))
    op.create_index("ix_competitions_code", "competitions", ["code"])
    op.create_table("clubs", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("slug", sa.String(120), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("short_name", sa.String(12), nullable=False), sa.UniqueConstraint("slug"))
    op.create_index("ix_clubs_slug", "clubs", ["slug"])
    op.create_table("methodology_versions", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("version", sa.String(64), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("published_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("version"))
    op.create_table("data_sources", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("status", sa.String(32), nullable=False), sa.Column("coverage", sa.Integer(), nullable=False), sa.Column("notes", sa.Text(), nullable=False), sa.CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_data_sources_coverage_range"), sa.UniqueConstraint("name"))
    op.create_table("players", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("source_player_id", sa.String(120), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("club_id", _bigint(), sa.ForeignKey("clubs.id", ondelete="RESTRICT"), nullable=False), sa.Column("birth_year", sa.Integer(), nullable=False), sa.UniqueConstraint("source_player_id"))
    op.create_index("ix_players_source_player_id", "players", ["source_player_id"])
    op.create_index("ix_players_name", "players", ["name"])
    op.create_index("ix_players_club_id", "players", ["club_id"])
    op.create_table("club_seasons", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("competition_id", _bigint(), sa.ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False), sa.Column("club_id", _bigint(), sa.ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False), sa.Column("season", sa.Integer(), nullable=False), sa.Column("played", sa.Integer(), nullable=False), sa.Column("points", sa.Integer(), nullable=False), sa.Column("goals_for", sa.Integer(), nullable=False), sa.Column("goals_against", sa.Integer(), nullable=False), sa.Column("expected_goals", sa.Numeric(7, 2)), sa.Column("expected_goals_against", sa.Numeric(7, 2)), sa.Column("possession_pct", sa.Numeric(5, 2)), sa.Column("defensive_actions_per90", sa.Numeric(6, 2)), sa.Column("consistency", sa.Integer()), sa.Column("coverage", sa.Integer(), nullable=False), sa.Column("snapshot_date", sa.Date(), nullable=False), sa.CheckConstraint("played >= 0", name="ck_club_seasons_played_nonnegative"), sa.CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_club_seasons_coverage_range"), sa.UniqueConstraint("competition_id", "club_id", "season", name="uq_club_season_scope"))
    op.create_index("ix_club_seasons_competition_season", "club_seasons", ["competition_id", "season"])
    op.create_index("ix_club_seasons_club_id", "club_seasons", ["club_id"])
    op.create_table("player_seasons", sa.Column("id", _bigint(), sa.Identity(), primary_key=True), sa.Column("player_id", _bigint(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False), sa.Column("competition_id", _bigint(), sa.ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False), sa.Column("season", sa.Integer(), nullable=False), sa.Column("position", sa.String(16), nullable=False), sa.Column("role", sa.String(120), nullable=False), sa.Column("minutes", sa.Integer(), nullable=False), sa.Column("performance", sa.Integer()), sa.Column("potential", sa.Integer()), sa.Column("opportunity", sa.Integer()), sa.Column("availability", sa.Integer()), sa.Column("coverage", sa.Integer(), nullable=False), sa.CheckConstraint("minutes >= 0", name="ck_player_seasons_minutes_nonnegative"), sa.CheckConstraint("coverage BETWEEN 0 AND 100", name="ck_player_seasons_coverage_range"), sa.UniqueConstraint("player_id", "competition_id", "season", name="uq_player_season_scope"))
    op.create_index("ix_player_seasons_player_id", "player_seasons", ["player_id"])
    op.create_index("ix_player_seasons_competition_id", "player_seasons", ["competition_id"])
    op.create_index("ix_player_seasons_filter", "player_seasons", ["season", "position", "minutes"])


def downgrade() -> None:
    op.drop_table("player_seasons")
    op.drop_table("club_seasons")
    op.drop_table("players")
    op.drop_table("data_sources")
    op.drop_table("methodology_versions")
    op.drop_table("clubs")
    op.drop_table("competitions")
