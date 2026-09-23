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


def test_moneyball_ranking_is_transparent_and_validated() -> None:
    with client() as api:
        response = api.post("/api/v1/moneyball/rank", json={"weights": {"performance": 45, "potential": 25, "opportunity": 20, "availability": 10}, "minimum_minutes": 900, "minimum_coverage": 60, "limit": 5})
        assert response.status_code == 200
        rows = response.json()
        assert len(rows) == 5
        assert rows == sorted(rows, key=lambda row: row["score"], reverse=True)
        assert set(rows[0]["components"]) == {"performance", "potential", "opportunity", "availability"}
        invalid = api.post("/api/v1/moneyball/rank", json={"weights": {"performance": 50, "potential": 25, "opportunity": 20, "availability": 10}})
        assert invalid.status_code == 422


def test_compare_requires_two_players() -> None:
    with client() as api:
        assert api.get("/api/v1/players/compare", params={"ids": "1"}).status_code == 422
        response = api.get("/api/v1/players/compare", params={"ids": "1,2"})
        assert response.status_code == 200
        assert len(response.json()) == 2
