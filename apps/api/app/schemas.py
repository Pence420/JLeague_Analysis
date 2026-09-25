from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TeamOut(ApiModel):
    id: int
    slug: str
    name: str
    name_ja: str
    short_name: str
    rank: int
    played: int
    wins: int
    draws: int
    losses: int
    points: int
    goals_for: int
    goals_against: int
    expected_goals: float | None
    expected_goals_against: float | None
    possession_pct: float | None
    defensive_actions_per90: float | None
    consistency: int | None
    coverage: int


class PlayerOut(ApiModel):
    id: int
    source_player_id: str
    name: str
    name_ja: str
    club_id: int
    club_name: str
    age: int
    position: str
    role: str
    minutes: int
    appearances: int
    goals: int
    jersey_number: int
    birth_date: date | None
    height_cm: int | None
    weight_kg: int | None
    performance: int | None
    potential: int | None
    opportunity: int | None
    availability: int | None
    coverage: int
    official_metrics: dict[str, "OfficialMetricOut"] = Field(default_factory=dict)
    derived_scores: "DerivedScoresOut"


class PlayerPage(ApiModel):
    items: list[PlayerOut]
    next_cursor: int | None


class OverviewOut(ApiModel):
    competition: str
    season: int
    snapshot_date: date
    methodology_version: str
    sample: bool
    team_count: int
    player_count: int
    average_team_coverage: float
    average_player_coverage: float


class RecruitmentWeights(BaseModel):
    role_performance: int = Field(ge=0, le=100)
    opportunity: int = Field(ge=0, le=100)
    development: int = Field(ge=0, le=100)
    availability: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def weights_total_one_hundred(self):
        if (
            self.role_performance + self.opportunity + self.development
            + self.availability + self.confidence
        ) != 100:
            raise ValueError("weights must total 100")
        return self


class RecruitmentRequest(BaseModel):
    weights: RecruitmentWeights = RecruitmentWeights(
        role_performance=50,
        opportunity=20,
        development=15,
        availability=10,
        confidence=5,
    )
    minimum_minutes: int = Field(default=900, ge=0, le=10000)
    position: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


class RankedPlayer(BaseModel):
    player: PlayerOut
    score: float
    components: dict[str, float]
    methodology_version: str


class OfficialMetricOut(ApiModel):
    value: float | None
    unit: str
    per90: float | None
    listing_status: str
    source_rank: int | None
    source_url: str
    retrieved_at: datetime


class DerivedScoresOut(BaseModel):
    status: str
    role_performance: float | None
    opportunity: float | None
    development: float | None
    availability: float | None
    confidence: float | None
    value_proxy: float | None
    methodology_version: str
    metrics_used: list[str]
    metrics_unavailable: list[str]
    reasons: list[str]
    limitations: list[str]


# One-release import compatibility for callers that still use the old name.
MoneyballRequest = RecruitmentRequest


class DataSourceOut(ApiModel):
    name: str
    status: str
    coverage: int
    notes: str


PlayerOut.model_rebuild()
