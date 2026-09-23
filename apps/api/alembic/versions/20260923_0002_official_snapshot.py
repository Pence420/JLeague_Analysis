"""Add official J1 2025 identity and season facts."""
from alembic import op
import sqlalchemy as sa

revision = "20260923_0002"
down_revision = "20260922_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clubs", sa.Column("name_ja", sa.String(160), nullable=False, server_default=""))
    op.add_column("club_seasons", sa.Column("rank", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("club_seasons", sa.Column("wins", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("club_seasons", sa.Column("draws", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("club_seasons", sa.Column("losses", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("players", sa.Column("name_ja", sa.String(160), nullable=False, server_default=""))
    op.add_column("players", sa.Column("birth_date", sa.Date(), nullable=True))
    op.add_column("players", sa.Column("height_cm", sa.Integer(), nullable=True))
    op.add_column("players", sa.Column("weight_kg", sa.Integer(), nullable=True))
    op.add_column("player_seasons", sa.Column("appearances", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("player_seasons", sa.Column("goals", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("player_seasons", sa.Column("jersey_number", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("player_seasons", "jersey_number")
    op.drop_column("player_seasons", "goals")
    op.drop_column("player_seasons", "appearances")
    op.drop_column("players", "weight_kg")
    op.drop_column("players", "height_cm")
    op.drop_column("players", "birth_date")
    op.drop_column("players", "name_ja")
    op.drop_column("club_seasons", "losses")
    op.drop_column("club_seasons", "draws")
    op.drop_column("club_seasons", "wins")
    op.drop_column("club_seasons", "rank")
    op.drop_column("clubs", "name_ja")
