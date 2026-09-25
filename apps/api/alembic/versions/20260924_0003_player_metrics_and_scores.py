"""Normalize player identity and add official metrics plus score snapshots.

Revision ID: 20260924_0003
Revises: 20260923_0002
"""

from alembic import op
import sqlalchemy as sa


revision = "20260924_0003"
down_revision = "20260923_0002"
branch_labels = None
depends_on = None


def _bigint():
    """Keep bigint IDs on Postgres and SQLite-compatible row IDs locally."""
    return sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def _normalize_player_identities() -> None:
    connection = op.get_bind()
    rows = connection.execute(sa.text(
        """
        SELECT p.id, p.source_player_id, p.club_id, c.slug
        FROM players p JOIN clubs c ON c.id = p.club_id
        ORDER BY p.id
        """
    )).mappings().all()

    grouped: dict[str, list[dict]] = {}
    for row in rows:
        suffix = f"-{row['slug']}"
        source_id = row["source_player_id"]
        if not source_id.endswith(suffix):
            raise RuntimeError(
                f"Cannot normalize player {source_id!r}: expected verified suffix {suffix!r}"
            )
        official_id = source_id[: -len(suffix)]
        if not official_id:
            raise RuntimeError(f"Cannot normalize empty official id from {source_id!r}")
        grouped.setdefault(official_id, []).append(dict(row))

    for official_id, identities in grouped.items():
        canonical = identities[0]
        for identity in identities:
            connection.execute(
                sa.text(
                    "UPDATE player_seasons SET player_id = :canonical_id, club_id = :club_id "
                    "WHERE player_id = :old_id"
                ),
                {
                    "canonical_id": canonical["id"],
                    "club_id": identity["club_id"],
                    "old_id": identity["id"],
                },
            )
        duplicate_ids = [identity["id"] for identity in identities[1:]]
        for duplicate_id in duplicate_ids:
            connection.execute(
                sa.text("DELETE FROM players WHERE id = :player_id"),
                {"player_id": duplicate_id},
            )
        connection.execute(
            sa.text("UPDATE players SET source_player_id = :official_id WHERE id = :player_id"),
            {"official_id": official_id, "player_id": canonical["id"]},
        )


def upgrade() -> None:
    op.add_column("player_seasons", sa.Column("club_id", _bigint(), nullable=True))
    op.create_index("ix_player_seasons_club_id", "player_seasons", ["club_id"])
    op.execute(
        "UPDATE player_seasons SET club_id = "
        "(SELECT players.club_id FROM players WHERE players.id = player_seasons.player_id)"
    )
    with op.batch_alter_table("player_seasons") as batch_op:
        batch_op.drop_constraint("uq_player_season_scope", type_="unique")
        batch_op.create_foreign_key(
            "fk_player_seasons_club_id_clubs",
            "clubs",
            ["club_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    _normalize_player_identities()

    with op.batch_alter_table("player_seasons") as batch_op:
        batch_op.alter_column("club_id", existing_type=_bigint(), nullable=False)
        batch_op.create_unique_constraint(
            "uq_player_season_scope",
            ["player_id", "club_id", "competition_id", "season"],
        )
    with op.batch_alter_table("players") as batch_op:
        batch_op.drop_index("ix_players_club_id")
        batch_op.drop_column("club_id")

    op.create_table(
        "player_metric_values",
        sa.Column("id", _bigint(), sa.Identity(), primary_key=True),
        sa.Column("player_season_id", _bigint(), nullable=False),
        sa.Column("metric_key", sa.String(80), nullable=False),
        sa.Column("value", sa.Numeric(12, 4), nullable=True),
        sa.Column("unit", sa.String(32), nullable=False),
        sa.Column("listing_status", sa.String(24), nullable=False),
        sa.Column("source_rank", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("retrieved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["player_season_id"], ["player_seasons.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("player_season_id", "metric_key", name="uq_player_metric_value"),
        sa.CheckConstraint(
            "listing_status IN ('listed', 'not_listed', 'unavailable')",
            name="ck_player_metric_values_listing_status",
        ),
        sa.CheckConstraint(
            "(listing_status = 'listed' AND value IS NOT NULL) OR "
            "(listing_status != 'listed' AND value IS NULL)",
            name="ck_player_metric_values_value_status",
        ),
    )
    op.create_index(
        "ix_player_metric_values_player_season_id",
        "player_metric_values",
        ["player_season_id"],
    )
    op.create_index("ix_player_metric_values_metric_key", "player_metric_values", ["metric_key"])

    op.create_table(
        "player_score_snapshots",
        sa.Column("id", _bigint(), sa.Identity(), primary_key=True),
        sa.Column("player_season_id", _bigint(), nullable=False),
        sa.Column("methodology_version", sa.String(64), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("role_performance", sa.Numeric(7, 4), nullable=True),
        sa.Column("opportunity", sa.Numeric(7, 4), nullable=True),
        sa.Column("development", sa.Numeric(7, 4), nullable=True),
        sa.Column("availability", sa.Numeric(7, 4), nullable=True),
        sa.Column("confidence", sa.Numeric(7, 4), nullable=True),
        sa.Column("value_proxy", sa.Numeric(7, 4), nullable=True),
        sa.Column("metrics_used", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("metrics_unavailable", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("reasons", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["player_season_id"], ["player_seasons.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "player_season_id", "methodology_version", name="uq_player_score_snapshot"
        ),
        sa.CheckConstraint(
            "status IN ('scored', 'ineligible', 'not_scored')",
            name="ck_player_score_snapshots_status",
        ),
        sa.CheckConstraint(
            "confidence IS NULL OR confidence BETWEEN 0 AND 100",
            name="ck_player_score_snapshots_confidence_range",
        ),
    )
    op.create_index(
        "ix_player_score_snapshots_player_season_id",
        "player_score_snapshots",
        ["player_season_id"],
    )
    op.create_index(
        "ix_player_score_snapshots_methodology_value",
        "player_score_snapshots",
        ["methodology_version", "value_proxy"],
    )


def _denormalize_player_identities() -> None:
    """Recreate one club-scoped Player per club-season before dropping club_id."""

    connection = op.get_bind()
    players = connection.execute(sa.text(
        "SELECT id, source_player_id, name, name_ja, birth_year, birth_date, height_cm, weight_kg "
        "FROM players ORDER BY id"
    )).mappings().all()
    next_player_id = int(
        connection.execute(sa.text("SELECT COALESCE(MAX(id), 0) FROM players")).scalar_one()
    ) + 1
    for player in players:
        seasons = connection.execute(sa.text(
            "SELECT ps.id, ps.club_id, c.slug FROM player_seasons ps "
            "JOIN clubs c ON c.id = ps.club_id WHERE ps.player_id = :player_id ORDER BY ps.id"
        ), {"player_id": player["id"]}).mappings().all()
        if not seasons:
            continue
        first = seasons[0]
        connection.execute(sa.text(
            "UPDATE players SET club_id = :club_id, source_player_id = :source_id WHERE id = :player_id"
        ), {
            "club_id": first["club_id"],
            "source_id": f"{player['source_player_id']}-{first['slug']}",
            "player_id": player["id"],
        })
        for season in seasons[1:]:
            new_id = next_player_id
            next_player_id += 1
            connection.execute(sa.text(
                "INSERT INTO players (id, source_player_id, name, name_ja, club_id, birth_year, birth_date, height_cm, weight_kg) "
                "VALUES (:id, :source_id, :name, :name_ja, :club_id, :birth_year, :birth_date, :height_cm, :weight_kg)"
            ), {
                "id": new_id,
                "source_id": f"{player['source_player_id']}-{season['slug']}",
                "name": player["name"], "name_ja": player["name_ja"],
                "club_id": season["club_id"], "birth_year": player["birth_year"],
                "birth_date": player["birth_date"], "height_cm": player["height_cm"],
                "weight_kg": player["weight_kg"],
            })
            connection.execute(sa.text(
                "UPDATE player_seasons SET player_id = :new_id WHERE id = :season_id"
            ), {"new_id": new_id, "season_id": season["id"]})


def downgrade() -> None:
    op.drop_index("ix_player_score_snapshots_methodology_value", table_name="player_score_snapshots")
    op.drop_index("ix_player_score_snapshots_player_season_id", table_name="player_score_snapshots")
    op.drop_table("player_score_snapshots")
    op.drop_index("ix_player_metric_values_metric_key", table_name="player_metric_values")
    op.drop_index("ix_player_metric_values_player_season_id", table_name="player_metric_values")
    op.drop_table("player_metric_values")

    op.add_column("players", sa.Column("club_id", _bigint(), nullable=True))
    op.create_index("ix_players_club_id", "players", ["club_id"])
    with op.batch_alter_table("players") as batch_op:
        batch_op.create_foreign_key(
            "fk_players_club_id_clubs", "clubs", ["club_id"], ["id"], ondelete="RESTRICT"
        )
    with op.batch_alter_table("player_seasons") as batch_op:
        batch_op.drop_constraint("uq_player_season_scope", type_="unique")

    _denormalize_player_identities()

    with op.batch_alter_table("players") as batch_op:
        batch_op.alter_column("club_id", existing_type=_bigint(), nullable=False)
    with op.batch_alter_table("player_seasons") as batch_op:
        batch_op.create_unique_constraint(
            "uq_player_season_scope", ["player_id", "competition_id", "season"]
        )
        batch_op.drop_constraint("fk_player_seasons_club_id_clubs", type_="foreignkey")
        batch_op.drop_index("ix_player_seasons_club_id")
        batch_op.drop_column("club_id")
