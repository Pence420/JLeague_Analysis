import json
from pathlib import Path


CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "jleague" / "metric-catalog.json"


def test_metric_catalog_has_unique_keys_and_explicit_usage_status() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    keys = [item["key"] for item in catalog["metrics"]]

    assert len(keys) == len(set(keys))
    assert catalog["usageStatus"] in {"research_only", "approved"}
    assert all(item["direction"] in {"higher", "lower", "neutral"} for item in catalog["metrics"])
    assert all(item["positions"] for item in catalog["metrics"])
    assert all(item["usageStatus"] == catalog["usageStatus"] for item in catalog["metrics"])


def test_metric_catalog_contains_every_scoring_input() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    keys = {item["key"] for item in catalog["metrics"]}

    assert keys == {
        "non_penalty_xg",
        "goals",
        "assists",
        "chances_created",
        "shots_on_target_rate",
        "dribble_success",
        "duels_won_per90",
        "opposition_half_pass_completion",
        "through_passes",
        "interceptions",
        "goals_minus_xg",
        "aerial_duel_win_rate",
        "tackles",
        "tackle_success",
        "clearances",
        "blocks",
        "pass_completion",
        "save_rate",
        "penalty_area_save_rate",
        "saves_per90",
        "cross_claim_rate",
        "clean_sheet_rate",
        "distribution_completion",
    }
