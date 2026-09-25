export type Confidence = "low" | "medium" | "high";
export type MetricKey = "points" | "goalsFor" | "goalDifference";
export type PlayerPosition = "GK" | "DF" | "MF" | "FW";
export type PlayerMetricKey =
  | "non_penalty_xg"
  | "goals"
  | "assists"
  | "chances_created"
  | "shots_on_target_rate"
  | "dribble_success"
  | "duels_won_per90"
  | "opposition_half_pass_completion"
  | "through_passes"
  | "interceptions"
  | "goals_minus_xg"
  | "aerial_duel_win_rate"
  | "tackles"
  | "tackle_success"
  | "clearances"
  | "blocks"
  | "pass_completion"
  | "save_rate"
  | "penalty_area_save_rate"
  | "saves_per90"
  | "cross_claim_rate"
  | "clean_sheet_rate"
  | "distribution_completion";

export interface OfficialMetric {
  value: number | null;
  unit: string;
  per90: number | null;
  listingStatus: "listed" | "not_listed" | "unavailable";
  sourceRank: number | null;
  sourceUrl: string;
  retrievedAt: string;
}

export interface DerivedScores {
  status: "scored" | "ineligible" | "not_scored";
  rolePerformance: number | null;
  opportunity: number | null;
  development: number | null;
  availability: number | null;
  confidence: number | null;
  valueProxy: number | null;
  methodologyVersion: string;
  metricsUsed: PlayerMetricKey[];
  metricsUnavailable: PlayerMetricKey[];
  reasons: string[];
  limitations: string[];
}

export interface ComponentWeights {
  rolePerformance: number;
  opportunity: number;
  development: number;
  availability: number;
  confidence: number;
}

export interface TeamSeason {
  id: string;
  name: string;
  nameJa: string;
  shortName: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  expectedGoals: number | null;
  expectedGoalsAgainst: number | null;
  possessionPct: number | null;
  defensiveActionsPer90: number | null;
  consistency: number | null;
  coverage: number;
}

export interface PlayerSeason {
  id: string;
  name: string;
  nameJa: string;
  teamId: string;
  position: PlayerPosition;
  role: string;
  age: number;
  minutes: number;
  appearances: number;
  goals: number;
  jerseyNumber: number;
  birthDate: string;
  heightCm: number | null;
  weightKg: number | null;
  coverage: number;
  officialMetrics: Partial<Record<PlayerMetricKey, OfficialMetric>>;
  derivedScores: DerivedScores;
}

export interface LeagueDataset {
  competition: "J1";
  season: 2025;
  snapshotDate: string;
  methodologyVersion: string;
  sample: false;
  teams: TeamSeason[];
  players: PlayerSeason[];
}

export interface LeagueStateRow {
  teamId: string;
  teamName: string;
  played: number;
  rank: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  pointsPerMatch: number;
  goalDifferencePer90: number;
  expectedGoalDifferencePer90: number | null;
  coverage: number;
}

export interface TeamLandscapePoint {
  teamId: string;
  teamName: string;
  shortName: string;
  x: number;
  y: number;
  z: number;
  raw: Record<MetricKey, number>;
  cluster: "Title race" | "Upper half" | "Mid-table" | "Relegation zone";
  coverage: number;
}

export interface EvidenceMetric {
  label: string;
  value: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  observation: string;
  interpretation: string;
  evidence: EvidenceMetric[];
  confidence: Confidence;
  coverage: number;
  limitation: string;
  tone: "positive" | "caution" | "neutral";
}

export interface RecruitmentSignal {
  playerId: string;
  playerName: string;
  teamName: string;
  position: PlayerPosition;
  role: string;
  age: number;
  minutes: number;
  score: number;
  reasons: string[];
  risk: string;
  coverage: number;
  confidence: Confidence;
}

export interface RoleSupply {
  role: string;
  count: number;
  share: number;
  status: "scarce" | "balanced" | "abundant";
}

export interface AnalystFinding extends EvidenceItem {
  rank: 1 | 2 | 3;
}

export interface LeagueDashboardViewModel {
  leagueState: LeagueStateRow[];
  landscape: TeamLandscapePoint[];
  performanceProcess: EvidenceItem[];
  sustainability: EvidenceItem[];
  recruitmentSignals: RecruitmentSignal[];
  roleSupply: RoleSupply[];
  analystBrief: AnalystFinding[];
  averageCoverage: number;
  missingMetricCount: number;
}
