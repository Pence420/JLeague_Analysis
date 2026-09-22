from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TeamOut(ApiModel):
    id: int
    slug: str
    name: str
    short_name: str
    played: int
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
    club_id: int
    club_name: str
    age: int
    position: str
    role: str
    minutes: int
    performance: int | None
    potential: int | None
    opportunity: int | None
    availability: int | None
    coverage: int


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


class MoneyballWeights(BaseModel):
    performance: int = Field(ge=0, le=100)
    potential: int = Field(ge=0, le=100)
    opportunity: int = Field(ge=0, le=100)
    availability: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def weights_total_one_hundred(self):
        if self.performance + self.potential + self.opportunity + self.availability != 100:
            raise ValueError("weights must total 100")
        return self


class MoneyballRequest(BaseModel):
    weights: MoneyballWeights = MoneyballWeights(performance=45, potential=25, opportunity=20, availability=10)
    minimum_minutes: int = Field(default=900, ge=0, le=10000)
    minimum_coverage: int = Field(default=60, ge=0, le=100)
    position: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


class RankedPlayer(BaseModel):
    player: PlayerOut
    score: int
    components: dict[str, float]


class DataSourceOut(ApiModel):
    name: str
    status: str
    coverage: int
    notes: str
