from fastapi.testclient import TestClient

from app.main import create_app


def client() -> TestClient:
    return TestClient(create_app("sqlite+pysqlite:///:memory:", should_seed=True))


def test_health_and_overview() -> None:
    with client() as api:
        health = api.get("/api/v1/health")
        assert health.json() == {"status": "ok", "database": "connected"}
        assert health.headers["x-content-type-options"] == "nosniff"
        assert health.headers["x-frame-options"] == "DENY"
        assert health.headers["cache-control"] == "no-store"
        overview = api.get("/api/v1/league/2025/overview")
        assert overview.status_code == 200
        assert overview.json()["team_count"] == 20
        assert overview.json()["player_count"] == 772
        assert overview.json()["sample"] is False


def test_player_cursor_and_filters() -> None:
    with client() as api:
        first = api.get("/api/v1/players", params={"position": "DF", "limit": 2}).json()
        assert len(first["items"]) == 2
        assert first["next_cursor"] is not None
        second = api.get("/api/v1/players", params={"position": "DF", "limit": 2, "after_id": first["next_cursor"]}).json()
        assert all(item["id"] > first["next_cursor"] for item in second["items"])


def test_recruitment_ranking_is_transparent_and_validated() -> None:
    with client() as api:
        response = api.post("/api/v1/recruitment/rank", json={"weights": {"role_performance": 50, "opportunity": 20, "development": 15, "availability": 10, "confidence": 5}, "minimum_minutes": 900, "limit": 5})
        assert response.status_code == 200
        rows = response.json()
        assert rows == []  # Official advanced values remain gated; the API must not invent scores.
        invalid = api.post("/api/v1/recruitment/rank", json={"weights": {"role_performance": 60, "opportunity": 20, "development": 15, "availability": 10, "confidence": 5}})
        assert invalid.status_code == 422

        compatibility = api.post("/api/v1/moneyball/rank", json={})
        assert compatibility.status_code == 200
        assert compatibility.headers["deprecation"] == "true"
        assert compatibility.headers["link"].endswith('rel="successor-version"')


def test_player_contract_separates_official_and_derived() -> None:
    with client() as api:
        player = api.get("/api/v1/players", params={"limit": 1}).json()["items"][0]
        assert "official_metrics" in player
        assert "derived_scores" in player
        assert set(player["official_metrics"]).isdisjoint(player["derived_scores"])
        assert player["derived_scores"]["status"] == "not_scored"
        assert player["derived_scores"]["role_performance"] is None
        assert player["derived_scores"]["opportunity"] is not None
        assert player["derived_scores"]["development"] is not None
        assert player["derived_scores"]["availability"] is not None
        assert player["derived_scores"]["confidence"] is not None
        assert player["derived_scores"]["value_proxy"] is None
        assert player["derived_scores"]["methodology_version"] == "jleague-official-2025.3"


def test_methodology_exposes_profiles_thresholds_and_limitations() -> None:
    with client() as api:
        methodology = api.get("/api/v1/methodology").json()
        assert methodology["version"] == "jleague-official-2025.3"
        assert set(methodology["role_profiles"]) == {"GK", "DF", "MF", "FW"}
        assert methodology["eligibility"]["default_minimum_minutes"] == 900
        assert methodology["missing_data"]["minimum_profile_weight"] == 60


def test_compare_requires_two_players() -> None:
    with client() as api:
        assert api.get("/api/v1/players/compare", params={"ids": "1"}).status_code == 422
        response = api.get("/api/v1/players/compare", params={"ids": "1,2"})
        assert response.status_code == 200
        assert len(response.json()) == 2
