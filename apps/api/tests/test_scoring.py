from app.scoring import (
    ROLE_PROFILES,
    PlayerScoringInput,
    ScoreResult,
    ScoringMetric,
    adjusted_percentile,
    calculate_score,
    rank_results,
)


def metric(value: float) -> ScoringMetric:
    return ScoringMetric(value=value, per90=value, listing_status="listed")


def player(
    position: str,
    player_id: str = "a",
    *,
    minutes: int = 1800,
    age: int = 24,
    appearances: int = 20,
) -> PlayerScoringInput:
    metrics = {entry.key: metric(10.0) for entry in ROLE_PROFILES[position]}
    return PlayerScoringInput(
        player_id=player_id,
        position=position,
        minutes=minutes,
        age=age,
        max_minutes=3420,
        metrics=metrics,
        appearances=appearances,
        data_coverage=100,
    )


def test_small_sample_percentile_is_shrunk_toward_fifty() -> None:
    assert adjusted_percentile(raw_percentile=90, minutes=450) == 60
    assert adjusted_percentile(raw_percentile=90, minutes=1800) == 90


def test_zero_minutes_is_ineligible_without_division() -> None:
    result = calculate_score(player("FW", minutes=0), cohort=[], minimum_minutes=450)
    assert result.status == "ineligible"
    assert result.value_proxy is None


def test_equal_cohort_has_stable_worked_result_for_every_position() -> None:
    for position in ("GK", "DF", "MF", "FW"):
        subject = player(position, "a")
        peer = player(position, "b")
        result = calculate_score(subject, [subject, peer], minimum_minutes=900)

        assert result.status == "scored"
        assert result.role_performance == 50.0
        assert result.opportunity == 50.0
        assert result.development == 60.4
        assert result.availability == 52.63
        assert result.confidence == 100.0
        assert result.value_proxy == 54.32


def test_profiles_do_not_smuggle_wrong_position_signals() -> None:
    assert "goals" not in {entry.key for entry in ROLE_PROFILES["DF"]}
    clean_sheet = next(entry for entry in ROLE_PROFILES["GK"] if entry.key == "clean_sheet_rate")
    assert clean_sheet.weight == 0.10


def test_too_few_role_metrics_returns_not_scored() -> None:
    subject = player("DF")
    subject = PlayerScoringInput(
        player_id=subject.player_id,
        position=subject.position,
        minutes=subject.minutes,
        age=subject.age,
        max_minutes=subject.max_minutes,
        metrics=dict(list(subject.metrics.items())[:2]),
        appearances=subject.appearances,
        data_coverage=subject.data_coverage,
    )
    result = calculate_score(subject, [subject, player("DF", "b")], minimum_minutes=900)

    assert result.status == "not_scored"
    assert result.reason == "insufficient_role_metrics"


def test_missing_role_metrics_still_returns_base_data_components() -> None:
    subject = PlayerScoringInput(
        player_id="a",
        position="MF",
        minutes=900,
        age=20,
        max_minutes=3420,
        metrics={},
        appearances=10,
        data_coverage=100,
    )
    peer = PlayerScoringInput(
        player_id="b",
        position="MF",
        minutes=1800,
        age=24,
        max_minutes=3420,
        metrics={},
        appearances=20,
        data_coverage=100,
    )

    result = calculate_score(subject, [subject, peer], minimum_minutes=900)

    assert result.status == "not_scored"
    assert result.role_performance is None
    assert result.opportunity == 75.0
    assert result.development == 92.0
    assert result.availability == 26.32
    assert result.confidence == 62.5
    assert result.value_proxy is None


def test_negative_metric_and_all_equal_values_never_produce_nan() -> None:
    subject = player("MF", "a")
    peer = player("MF", "b")
    subject.metrics["goals_minus_xg"] = metric(-4.0)
    peer.metrics["goals_minus_xg"] = metric(-4.0)

    result = calculate_score(subject, [subject, peer], minimum_minutes=900)
    assert result.status == "scored"
    assert result.value_proxy == 54.32


def test_rank_ties_use_confidence_minutes_then_id() -> None:
    def result(player_id: str, confidence: float, minutes: int) -> ScoreResult:
        return ScoreResult(
            player_id=player_id, position="MF", minutes=minutes, status="scored",
            role_performance=70, opportunity=70, development=70, availability=70,
            confidence=confidence, value_proxy=70, metrics_used=[], metrics_unavailable=[],
        )

    ranked = rank_results([
        result("b", 90, 2000), result("a", 90, 2000), result("c", 80, 2500)
    ])
    assert [item.player_id for item in ranked] == ["a", "b", "c"]
