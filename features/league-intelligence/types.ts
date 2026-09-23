export type Confidence = "low" | "medium" | "high";
export type MetricKey = "points" | "goalsFor" | "goalDifference";
export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

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
  performance: number | null;
  potential: number | null;
  opportunity: number | null;
  availability: number | null;
  coverage: number;
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
