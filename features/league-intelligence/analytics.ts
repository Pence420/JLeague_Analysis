import type {
  AnalystFinding,
  Confidence,
  EvidenceItem,
  LeagueDashboardViewModel,
  LeagueDataset,
  LeagueStateRow,
  MetricKey,
  RecruitmentSignal,
  RoleSupply,
  TeamLandscapePoint,
  TeamSeason,
} from "./types";

export const DEFAULT_AXES = ["points", "goalsFor", "goalDifference"] as const;

export function per90(value: number | null, minutes: number): number | null {
  return value === null || minutes <= 0 ? null : (value / minutes) * 90;
}

export function formatMetric(
  value: number | null,
  format: "integer" | "decimal" | "percent",
): string {
  if (value === null || Number.isNaN(value)) return "Not available";
  if (format === "integer") return Math.round(value).toLocaleString("en-US");
  if (format === "percent") return `${Math.round(value)}%`;
  return value.toFixed(2);
}

export function confidenceFromCoverage(coverage: number): Confidence {
  if (coverage >= 90) return "high";
  if (coverage >= 80) return "medium";
  return "low";
}

function teamMetric(team: TeamSeason, key: MetricKey): number {
  if (key === "points") return team.points;
  if (key === "goalsFor") return team.goalsFor;
  return team.goalsFor - team.goalsAgainst;
}

function normalize(value: number, values: number[]): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min ? 0 : ((value - min) / (max - min)) * 2 - 1;
}

export function buildLeagueState(dataset: LeagueDataset): LeagueStateRow[] {
  return dataset.teams
    .map((team) => ({
      teamId: team.id,
      teamName: team.name,
      played: team.played,
      rank: team.rank,
      points: team.points,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      pointsPerMatch: team.points / team.played,
      goalDifferencePer90: (team.goalsFor - team.goalsAgainst) / team.played,
      expectedGoalDifferencePer90: null,
      coverage: team.coverage,
    }))
    .sort((a, b) => a.rank - b.rank);
}

export function buildTeamLandscape(
  dataset: LeagueDataset,
  axes: readonly [MetricKey, MetricKey, MetricKey],
): TeamLandscapePoint[] {
  const valuesByAxis = axes.map((axis) =>
    dataset.teams.map((team) => teamMetric(team, axis)),
  );
  return dataset.teams.map((team) => {
    const raw = Object.fromEntries(
      DEFAULT_AXES.map((key) => [key, teamMetric(team, key)]),
    ) as Record<MetricKey, number>;
    const [xValue, yValue, zValue] = axes.map((axis) => teamMetric(team, axis));
    const cluster =
      team.rank <= 3
        ? "Title race"
        : team.rank <= 10
          ? "Upper half"
          : team.rank <= 17
            ? "Mid-table"
            : "Relegation zone";
    return {
      teamId: team.id,
      teamName: team.name,
      shortName: team.shortName,
      x: normalize(xValue, valuesByAxis[0]),
      y: normalize(yValue, valuesByAxis[1]),
      z: normalize(zValue, valuesByAxis[2]),
      raw,
      cluster,
      coverage: team.coverage,
    };
  });
}

export function buildPerformanceProcess(dataset: LeagueDataset): EvidenceItem[] {
  return [...dataset.teams]
    .sort(
      (a, b) =>
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        a.rank - b.rank,
    )
    .slice(0, 3)
    .map((team) => {
      const goalDifference = team.goalsFor - team.goalsAgainst;
      return {
        id: `balance-${team.id}`,
        title: `${team.name}: strongest final goal balance`,
        observation: `${team.goalsFor} scored and ${team.goalsAgainst} conceded produced a ${goalDifference >= 0 ? "+" : ""}${goalDifference} goal difference.`,
        interpretation:
          "The season-long scoring margin supports the final standing, but does not isolate schedule or game-state effects.",
        evidence: [
          { label: "Goals for", value: String(team.goalsFor) },
          { label: "Goals against", value: String(team.goalsAgainst) },
        ],
        confidence: "high" as const,
        coverage: team.coverage,
        limitation: "No event-level xG or opponent-strength adjustment is included.",
        tone: "positive" as const,
      };
    });
}

export function buildSustainabilityWatch(dataset: LeagueDataset): EvidenceItem[] {
  return [...dataset.teams]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || a.rank - b.rank)
    .slice(0, 3)
    .map((team) => ({
      id: `defence-${team.id}`,
      title: `${team.name}: defensive platform`,
      observation: `${team.goalsAgainst} goals conceded in ${team.played} league matches (${(team.goalsAgainst / team.played).toFixed(2)} per match).`,
      interpretation:
        "Low goals conceded is a durable season outcome, though it cannot separate goalkeeper, defending and opponent finishing effects.",
      evidence: [
        { label: "Conceded", value: String(team.goalsAgainst) },
        { label: "Per match", value: (team.goalsAgainst / team.played).toFixed(2) },
      ],
      confidence: "high" as const,
      coverage: team.coverage,
      limitation: "Chance quality and shot locations are unavailable in this snapshot.",
      tone: "neutral" as const,
    }));
}

function weightedScore(values: Array<[number | null, number]>): number | null {
  const available = values.filter(
    (item): item is [number, number] => item[0] !== null,
  );
  const weight = available.reduce((sum, item) => sum + item[1], 0);
  return weight === 0
    ? null
    : available.reduce(
        (sum, [value, itemWeight]) => sum + value * itemWeight,
        0,
      ) / weight;
}

export function buildRecruitmentSignals(
  dataset: LeagueDataset,
  options: { minimumMinutes: 450 | 900 },
): RecruitmentSignal[] {
  const teamNames = new Map(dataset.teams.map((team) => [team.id, team.name]));
  return dataset.players
    .filter(
      (player) =>
        player.minutes >= options.minimumMinutes && player.coverage >= 60,
    )
    .map((player) => {
      const score =
        weightedScore([
          [player.performance, 0.45],
          [player.potential, 0.25],
          [player.opportunity, 0.2],
          [player.availability, 0.1],
        ]) ?? 0;
      return {
        playerId: player.id,
        playerName: player.name,
        teamName: teamNames.get(player.teamId) ?? "Unknown club",
        position: player.position,
        role: player.role,
        age: player.age,
        minutes: player.minutes,
        score: Math.round(score),
        reasons: [
          `${player.appearances} league appearances`,
          `${player.goals} goals in ${player.minutes.toLocaleString("en-US")} minutes`,
        ],
        risk:
          "J-Scout score is derived from appearances, minutes, goals and age—not a scouting verdict.",
        coverage: player.coverage,
        confidence: confidenceFromCoverage(player.coverage),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.minutes - a.minutes || a.playerId.localeCompare(b.playerId),
    )
    .slice(0, 8);
}

export function buildRoleSupply(dataset: LeagueDataset): RoleSupply[] {
  const counts = new Map<string, number>();
  dataset.players.forEach((player) =>
    counts.set(player.role, (counts.get(player.role) ?? 0) + 1),
  );
  const maximum = Math.max(...counts.values());
  return [...counts.entries()]
    .map(([role, count]) => ({
      role,
      count,
      share: Math.round((count / maximum) * 100),
      status:
        count < maximum * 0.5
          ? ("scarce" as const)
          : count === maximum
            ? ("abundant" as const)
            : ("balanced" as const),
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildAnalystBrief(dataset: LeagueDataset): AnalystFinding[] {
  const [champion, runnerUp] = [...dataset.teams].sort((a, b) => a.rank - b.rank);
  const bestAttack = [...dataset.teams].sort(
    (a, b) => b.goalsFor - a.goalsFor || a.rank - b.rank,
  )[0];
  const bestDefence = [...dataset.teams].sort(
    (a, b) => a.goalsAgainst - b.goalsAgainst || a.rank - b.rank,
  )[0];
  const findings: EvidenceItem[] = [
    {
      id: "title-margin",
      title: `${champion.name} won a one-point title race`,
      observation: `${champion.points} points finished just ${champion.points - runnerUp.points} ahead of ${runnerUp.name}.`,
      interpretation:
        "The championship margin was extremely narrow: one additional draw or defeat could have reversed the top two.",
      evidence: [
        { label: "Champion points", value: String(champion.points) },
        { label: "Runner-up points", value: String(runnerUp.points) },
      ],
      confidence: "high",
      coverage: 100,
      limitation: "Final-table evidence describes the outcome, not causal match dynamics.",
      tone: "positive",
    },
    {
      id: "best-attack",
      title: `${bestAttack.name} produced the league's highest scoring output`,
      observation: `${bestAttack.goalsFor} goals across ${bestAttack.played} matches (${(bestAttack.goalsFor / bestAttack.played).toFixed(2)} per match).`,
      interpretation:
        "Raw scoring volume identifies attacking output; shot quality and game state require separate video or event-data review.",
      evidence: [
        { label: "Goals", value: String(bestAttack.goalsFor) },
        { label: "Final rank", value: String(bestAttack.rank) },
      ],
      confidence: "high",
      coverage: 100,
      limitation: "No xG or shot-location data is included.",
      tone: "neutral",
    },
    {
      id: "best-defence",
      title: `${bestDefence.name} finished with the fewest goals conceded`,
      observation: `${bestDefence.goalsAgainst} conceded, or ${(bestDefence.goalsAgainst / bestDefence.played).toFixed(2)} per match.`,
      interpretation:
        "The defensive record is strong outcome evidence, but should not be assigned to individuals without event and video context.",
      evidence: [
        { label: "Conceded", value: String(bestDefence.goalsAgainst) },
        { label: "Goal difference", value: String(bestDefence.goalsFor - bestDefence.goalsAgainst) },
      ],
      confidence: "high",
      coverage: 100,
      limitation: "Goalkeeping and defensive contributions are not decomposed.",
      tone: "neutral",
    },
  ];
  return findings.map((finding, index) => ({
    ...finding,
    rank: (index + 1) as 1 | 2 | 3,
  }));
}

export function buildLeagueDashboard(
  dataset: LeagueDataset,
  options: {
    minimumMinutes: 450 | 900;
    axes: readonly [MetricKey, MetricKey, MetricKey];
  },
): LeagueDashboardViewModel {
  return {
    leagueState: buildLeagueState(dataset),
    landscape: buildTeamLandscape(dataset, options.axes),
    performanceProcess: buildPerformanceProcess(dataset),
    sustainability: buildSustainabilityWatch(dataset),
    recruitmentSignals: buildRecruitmentSignals(dataset, {
      minimumMinutes: options.minimumMinutes,
    }),
    roleSupply: buildRoleSupply(dataset),
    analystBrief: buildAnalystBrief(dataset),
    averageCoverage:
      dataset.teams.reduce((sum, team) => sum + team.coverage, 0) /
      dataset.teams.length,
    missingMetricCount: 0,
  };
}
