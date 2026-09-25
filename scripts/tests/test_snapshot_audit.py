import json
from pathlib import Path


SNAPSHOT_PATH = Path(__file__).resolve().parents[2] / "data" / "jleague" / "2025.json"
DERIVED_KEYS = {
    "status",
    "rolePerformance",
    "opportunity",
    "development",
    "availability",
    "confidence",
    "valueProxy",
    "methodologyVersion",
}


def snapshot() -> dict:
    return json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))


def test_snapshot_has_complete_league_and_unique_club_seasons() -> None:
    data = snapshot()
    record_ids = [player["id"] for player in data["players"]]

    assert len(data["teams"]) == 20
    assert len(data["players"]) >= 500
    assert len(record_ids) == len(set(record_ids))


def test_official_metric_namespace_never_contains_derived_scores() -> None:
    for player in snapshot()["players"]:
        official = player.get("officialMetrics", {})
        assert DERIVED_KEYS.isdisjoint(official)
        for metric in official.values():
            if metric["listingStatus"] != "listed":
                assert metric["value"] is None


def test_checked_in_scores_respect_default_minimum_minutes() -> None:
    for player in snapshot()["players"]:
        score = player.get("derivedScores")
        if score and score["status"] == "scored":
            assert player["minutes"] >= 900
