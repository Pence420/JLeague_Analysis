"""Canonical, position-aware Recruitment Value Proxy calculations."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal


ScoreStatus = Literal["scored", "ineligible", "not_scored"]
ListingStatus = Literal["listed", "not_listed", "unavailable"]


@dataclass(frozen=True)
class ProfileMetric:
    key: str
    weight: float
    use_per90: bool = False
    direction: Literal["higher", "lower"] = "higher"


ROLE_PROFILES: dict[str, tuple[ProfileMetric, ...]] = {
    "FW": (
        ProfileMetric("non_penalty_xg", 0.25, use_per90=True),
        ProfileMetric("goals", 0.20, use_per90=True),
        ProfileMetric("assists", 0.15, use_per90=True),
        ProfileMetric("chances_created", 0.15, use_per90=True),
        ProfileMetric("shots_on_target_rate", 0.10),
        ProfileMetric("dribble_success", 0.10),
        ProfileMetric("duels_won_per90", 0.05),
    ),
    "MF": (
        ProfileMetric("chances_created", 0.20, use_per90=True),
        ProfileMetric("assists", 0.15, use_per90=True),
        ProfileMetric("opposition_half_pass_completion", 0.15),
        ProfileMetric("through_passes", 0.15, use_per90=True),
        ProfileMetric("dribble_success", 0.10),
        ProfileMetric("duels_won_per90", 0.10),
        ProfileMetric("interceptions", 0.10, use_per90=True),
        ProfileMetric("goals_minus_xg", 0.05),
    ),
    "DF": (
        ProfileMetric("duels_won_per90", 0.20),
        ProfileMetric("aerial_duel_win_rate", 0.20),
        ProfileMetric("interceptions", 0.15, use_per90=True),
        ProfileMetric("tackles", 0.15, use_per90=True),
        ProfileMetric("tackle_success", 0.10),
        ProfileMetric("clearances", 0.05, use_per90=True),
        ProfileMetric("blocks", 0.05, use_per90=True),
        ProfileMetric("pass_completion", 0.10),
    ),
    "GK": (
        ProfileMetric("save_rate", 0.35),
        ProfileMetric("penalty_area_save_rate", 0.20),
        ProfileMetric("saves_per90", 0.15),
        ProfileMetric("cross_claim_rate", 0.10),
        ProfileMetric("clean_sheet_rate", 0.10),
        ProfileMetric("distribution_completion", 0.10),
    ),
}


@dataclass
class ScoringMetric:
    value: float | None
    per90: float | None = None
    listing_status: ListingStatus = "listed"


@dataclass
class PlayerScoringInput:
    player_id: str
    position: str
    minutes: int
    age: int
    max_minutes: int
    metrics: dict[str, ScoringMetric]
    appearances: int = 0
    data_coverage: float = 100.0


@dataclass
class ScoreResult:
    player_id: str
    position: str
    minutes: int
    status: ScoreStatus
    role_performance: float | None = None
    opportunity: float | None = None
    development: float | None = None
    availability: float | None = None
    confidence: float | None = None
    value_proxy: float | None = None
    metrics_used: list[str] = field(default_factory=list)
    metrics_unavailable: list[str] = field(default_factory=list)
    reason: str | None = None
    limitations: list[str] = field(default_factory=list)
    raw_value_proxy: float | None = field(default=None, repr=False)


def adjusted_percentile(raw_percentile: float, minutes: int) -> float:
    reliability = min(1.0, max(0, minutes) / 1800)
    return 50 + reliability * (raw_percentile - 50)


def percentile_rank(
    value: float,
    values: list[float],
    direction: Literal["higher", "lower"] = "higher",
) -> float:
    finite = [item for item in values if math.isfinite(item)]
    if not finite or not math.isfinite(value):
        return 50.0
    lower = sum(item < value for item in finite)
    equal = sum(item == value for item in finite)
    percentile = (lower + 0.5 * equal) / len(finite) * 100
    return 100 - percentile if direction == "lower" else percentile


def _metric_value(player: PlayerScoringInput, definition: ProfileMetric) -> float | None:
    metric = player.metrics.get(definition.key)
    if metric is None or metric.listing_status != "listed":
        return None
    value = metric.per90 if definition.use_per90 else metric.value
    if value is None or not math.isfinite(value):
        return None
    return value


def _role_performance(
    player: PlayerScoringInput, cohort: list[PlayerScoringInput]
) -> tuple[float | None, float, list[str], list[str]]:
    profile = ROLE_PROFILES.get(player.position)
    if profile is None:
        return None, 0.0, [], []

    available = [entry for entry in profile if _metric_value(player, entry) is not None]
    available_weight = sum(entry.weight for entry in available)
    used = [entry.key for entry in available]
    unavailable = [entry.key for entry in profile if entry not in available]
    if available_weight < 0.60:
        return None, available_weight, used, unavailable

    peers = [item for item in cohort if item.position == player.position]
    if all(item.player_id != player.player_id for item in peers):
        peers.append(player)
    weighted = 0.0
    for entry in available:
        value = _metric_value(player, entry)
        assert value is not None
        peer_values = [
            candidate_value
            for candidate in peers
            if (candidate_value := _metric_value(candidate, entry)) is not None
        ]
        raw = percentile_rank(value, peer_values, entry.direction)
        weighted += adjusted_percentile(raw, player.minutes) * entry.weight
    return weighted / available_weight, available_weight, used, unavailable


def _age_band(age: int) -> int:
    if age <= 21:
        return 0
    if age <= 24:
        return 1
    if age <= 28:
        return 2
    return 3


def _round(value: float | None) -> float | None:
    return None if value is None else round(value, 2)


def _base_data_components(
    player: PlayerScoringInput,
    peers: list[PlayerScoringInput],
    role_coverage: float,
) -> tuple[float, float, float, float]:
    minute_usage = percentile_rank(player.minutes, [item.minutes for item in peers])
    appearance_usage = percentile_rank(
        player.appearances,
        [item.appearances for item in peers],
    )
    opportunity = 100 - (0.70 * minute_usage + 0.30 * appearance_usage)

    age_runway = max(0.0, min(100.0, 100 - max(0, player.age - 18) * 4))
    maximum_appearances = player.max_minutes / 90 if player.max_minutes > 0 else 0
    minute_share = (
        min(100.0, player.minutes / player.max_minutes * 100)
        if player.max_minutes > 0
        else 0.0
    )
    appearance_share = (
        min(100.0, player.appearances / maximum_appearances * 100)
        if maximum_appearances > 0
        else 0.0
    )
    availability = 0.70 * minute_share + 0.30 * appearance_share

    sample_reliability = min(100.0, max(0, player.minutes) / 1800 * 100)
    confidence = (
        0.45 * max(0.0, min(100.0, player.data_coverage))
        + 0.35 * sample_reliability
        + 0.20 * max(0.0, min(1.0, role_coverage)) * 100
    )
    return opportunity, age_runway, availability, confidence


def calculate_score(
    player: PlayerScoringInput,
    cohort: list[PlayerScoringInput],
    minimum_minutes: int,
) -> ScoreResult:
    if player.minutes <= 0 or player.minutes < minimum_minutes:
        return ScoreResult(
            player_id=player.player_id,
            position=player.position,
            minutes=player.minutes,
            status="ineligible",
            reason="below_minimum_minutes",
        )

    peers = [item for item in cohort if item.position == player.position]
    if all(item.player_id != player.player_id for item in peers):
        peers.append(player)
    role, coverage, used, unavailable = _role_performance(player, peers)
    base_opportunity, age_runway, availability, confidence = _base_data_components(
        player,
        peers,
        coverage,
    )
    if role is None:
        return ScoreResult(
            player_id=player.player_id,
            position=player.position,
            minutes=player.minutes,
            status="not_scored",
            opportunity=_round(base_opportunity),
            development=_round(age_runway),
            availability=_round(availability),
            confidence=_round(confidence),
            metrics_used=used,
            metrics_unavailable=unavailable,
            reason="insufficient_role_metrics",
            limitations=[
                "Development is an age-runway proxy until official role metrics are available.",
                "The final Recruitment Value Proxy remains unavailable without role performance.",
            ],
        )

    opportunity = 0.60 * role + 0.40 * base_opportunity

    same_age_band_roles: list[float] = []
    for peer in peers:
        if _age_band(peer.age) != _age_band(player.age):
            continue
        peer_role, _, _, _ = _role_performance(peer, peers)
        if peer_role is not None:
            same_age_band_roles.append(peer_role)
    performance_within_age = percentile_rank(role, same_age_band_roles)
    development = 0.60 * performance_within_age + 0.40 * age_runway
    value_proxy = (
        role * 0.50
        + opportunity * 0.20
        + development * 0.15
        + availability * 0.10
        + confidence * 0.05
    )
    limitations = []
    if player.position == "GK":
        limitations.append("Clean-sheet rate is influenced by team defending.")

    return ScoreResult(
        player_id=player.player_id,
        position=player.position,
        minutes=player.minutes,
        status="scored",
        role_performance=_round(role),
        opportunity=_round(opportunity),
        development=_round(development),
        availability=_round(availability),
        confidence=_round(confidence),
        value_proxy=_round(value_proxy),
        metrics_used=used,
        metrics_unavailable=unavailable,
        limitations=limitations,
        raw_value_proxy=value_proxy,
    )


def rank_results(results: list[ScoreResult]) -> list[ScoreResult]:
    return sorted(
        results,
        key=lambda item: (
            -(item.raw_value_proxy if item.raw_value_proxy is not None else item.value_proxy or -1),
            -(item.confidence or -1),
            -item.minutes,
            item.player_id,
        ),
    )
