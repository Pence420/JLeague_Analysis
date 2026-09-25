from dataclasses import replace
from pathlib import Path

import pytest

from scripts.jleague_stats import (
    MetricDefinition,
    OfficialMetricRow,
    join_metric_rows,
    parse_metric_page,
)
from scripts.import_jleague_2025 import require_official_stats_approval, write_import_audit


FIXTURES = Path(__file__).parent / "fixtures" / "jleague"


def definition(key: str, *, unit: str = "count", value_kind: str = "count") -> MetricDefinition:
    return MetricDefinition(
        key=key,
        unit=unit,
        value_kind=value_kind,
        source_url=f"https://www.jleague.jp/stats/{key}",
    )


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_parse_percentage_and_zero_as_listed_values() -> None:
    rows = parse_metric_page(
        fixture("pass-completion.html"),
        definition("pass_completion", unit="percent", value_kind="percentage"),
    )

    assert rows[0].value == 87.4
    assert rows[0].listing_status == "listed"
    assert rows[-1].value == 0.0
    assert rows[-1].listing_status == "listed"


def test_parse_full_width_percentage() -> None:
    rows = parse_metric_page(
        fixture("goalkeeper-save-rate.html"),
        definition("save_rate", unit="percent", value_kind="percentage"),
    )

    assert rows[0].value == 79.8


def test_parser_rejects_wrong_metric_or_incomplete_page() -> None:
    valid = fixture("assists.html")

    with pytest.raises(ValueError, match="metric marker"):
        parse_metric_page(valid, definition("tackles"))

    with pytest.raises(ValueError, match="updated-at"):
        parse_metric_page(valid.replace("data-updated-at", "data-removed"), definition("assists"))

    with pytest.raises(ValueError, match="result row"):
        parse_metric_page(valid.replace("data-player-id", "data-removed"), definition("assists"))


PLAYERS = [
    {"id": "101-kashima", "officialPlayerId": "101", "nameJa": "佐藤 海", "teamNameJa": "鹿島"},
    {"id": "999-kobe", "officialPlayerId": "999", "nameJa": "未掲載 選手", "teamNameJa": "神戸"},
]


def test_join_leaves_absent_player_not_listed() -> None:
    rows = parse_metric_page(fixture("assists.html"), definition("assists"))
    result = join_metric_rows(PLAYERS, rows, "assists")

    assert result.values["101-kashima"] == {"value": 12.0, "listingStatus": "listed", "sourceRank": 1}
    assert result.values["999-kobe"] == {"value": None, "listingStatus": "not_listed", "sourceRank": None}


def test_transfer_keeps_two_club_seasons_for_one_official_identity() -> None:
    transfer_records = [
        {"id": "123-kashima", "officialPlayerId": "123", "nameJa": "移籍 選手", "teamNameJa": "鹿島"},
        {"id": "123-kashiwa", "officialPlayerId": "123", "nameJa": "移籍 選手", "teamNameJa": "柏"},
    ]
    rows = parse_metric_page(fixture("assists.html"), definition("assists"))
    result = join_metric_rows(transfer_records, rows, "assists")

    assert result.values["123-kashima"]["value"] == 2.0
    assert result.values["123-kashiwa"]["value"] == 1.0


def test_ambiguous_fallback_is_not_attached() -> None:
    duplicate_names = [
        {"id": "401-kobe", "officialPlayerId": "401", "nameJa": "同名 選手", "teamNameJa": "神戸"},
        {"id": "402-urawa", "officialPlayerId": "402", "nameJa": "同名 選手", "teamNameJa": "浦和"},
    ]
    name_only_rows = [
        OfficialMetricRow(
            player_id=None,
            player_name_ja="同名 選手",
            club_name_ja="不明",
            rank=1,
            value=7.0,
        )
    ]
    result = join_metric_rows(duplicate_names, name_only_rows, "tackles")

    assert result.ambiguous == ["同名 選手"]
    assert all(value["value"] is None for value in result.values.values())


def test_exact_official_id_does_not_fall_back_to_wrong_club() -> None:
    rows = parse_metric_page(fixture("assists.html"), definition("assists"))
    wrong_club = [replace(row, club_name_ja="浦和") for row in rows if row.player_id == "101"]
    result = join_metric_rows(PLAYERS, wrong_club, "assists")

    assert result.values["101-kashima"]["listingStatus"] == "not_listed"
    assert result.unmatched == ["101:佐藤 海:浦和"]


def test_official_stats_gate_fails_closed_for_research_only_catalog(tmp_path: Path) -> None:
    catalog = tmp_path / "catalog.json"
    catalog.write_text('{"usageStatus":"research_only"}', encoding="utf-8")

    with pytest.raises(PermissionError, match="research_only"):
        require_official_stats_approval(catalog)


def test_import_audit_records_skipped_official_stats(tmp_path: Path) -> None:
    output = tmp_path / "audit.json"
    write_import_audit(
        output,
        include_official_stats=False,
        usage_status="research_only",
        metric_results=[],
    )

    audit = output.read_text(encoding="utf-8")
    assert '"officialStatsAction": "skipped"' in audit
    assert '"usageStatus": "research_only"' in audit
