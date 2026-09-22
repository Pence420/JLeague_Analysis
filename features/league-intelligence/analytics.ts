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

export const DEFAULT_AXES = [
  "attackingOutput",
  "possessionControl",
  "defensiveDisruption",
] as const;

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

function teamMetric(team: TeamSeason, key: MetricKey): number | null {
  if (key === "attackingOutput")
    return team.expectedGoals === null
      ? null
      : team.expectedGoals / team.played;
  if (key === "possessionControl") return team.possessionPct;
  return team.defensiveActionsPer90;
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
      pointsPerMatch: team.points / team.played,
      goalDifferencePer90: (team.goalsFor - team.goalsAgainst) / team.played,
      expectedGoalDifferencePer90:
        team.expectedGoals === null || team.expectedGoalsAgainst === null
          ? null
          : (team.expectedGoals - team.expectedGoalsAgainst) / team.played,
      coverage: team.coverage,
    }))
    .sort(
      (a, b) =>
        b.pointsPerMatch - a.pointsPerMatch || a.teamId.localeCompare(b.teamId),
    );
}

export function buildTeamLandscape(
  dataset: LeagueDataset,
  axes: readonly [MetricKey, MetricKey, MetricKey],
): TeamLandscapePoint[] {
  const complete = dataset.teams.filter((team) =>
    axes.every((axis) => teamMetric(team, axis) !== null),
  );
  const valuesByAxis = axes.map((axis) =>
    complete.map((team) => teamMetric(team, axis) as number),
  );
  return complete.map((team) => {
    const raw = Object.fromEntries(
      DEFAULT_AXES.map((key) => [key, teamMetric(team, key) ?? 0]),
    ) as Record<MetricKey, number>;
    const [xValue, yValue, zValue] = axes.map(
      (axis) => teamMetric(team, axis) as number,
    );
    const cluster =
      raw.possessionControl >= 53 && raw.attackingOutput >= 1.25
        ? "Territorial controller"
        : raw.defensiveDisruption >= 20
          ? "Defensive disruptor"
          : raw.attackingOutput >= 1.25
            ? "Direct transition"
            : "Compact pragmatist";
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

export function buildPerformanceProcess(
  dataset: LeagueDataset,
): EvidenceItem[] {
  return dataset.teams
    .filter((team) => team.expectedGoals !== null)
    .map((team) => ({
      team,
      gap: (team.goalsFor - (team.expectedGoals as number)) / team.played,
    }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 3)
    .map(({ team, gap }) => ({
      id: `process-${team.id}`,
      title: `${team.name}: ${gap >= 0 ? "finishing ahead of process" : "output trails chance quality"}`,
      observation: `${team.name} has a ${Math.abs(gap).toFixed(2)} goals-per-match gap between actual and expected output.`,
      interpretation: `${gap >= 0 ? "Finishing has amplified results" : "Created chances have not fully converted"} within this sample; this is an indicator, not a forecast.`,
      evidence: [
        { label: "Goals", value: String(team.goalsFor) },
        {
          label: "Expected goals",
          value: formatMetric(team.expectedGoals, "decimal"),
        },
      ],
      confidence: confidenceFromCoverage(team.coverage),
      coverage: team.coverage,
      limitation:
        "Opponent strength and game state are not adjusted in this sample.",
      tone: gap >= 0 ? "positive" : "caution",
    }));
}

export function buildSustainabilityWatch(
  dataset: LeagueDataset,
): EvidenceItem[] {
  return dataset.teams
    .filter((team) => team.consistency !== null)
    .map((team) => ({
      team,
      process:
        team.expectedGoals === null
          ? 0
          : (team.expectedGoals - (team.expectedGoalsAgainst ?? 0)) /
            team.played,
    }))
    .sort(
      (a, b) =>
        (b.team.consistency ?? 0) +
        b.process * 10 -
        ((a.team.consistency ?? 0) + a.process * 10),
    )
    .slice(0, 3)
    .map(({ team, process }) => ({
      id: `sustainability-${team.id}`,
      title: `${team.name} · ${process >= 0 ? "supported" : "fragile"} trend`,
      observation: `Consistency is ${formatMetric(team.consistency, "percent")} with an underlying balance of ${process >= 0 ? "+" : ""}${process.toFixed(2)} per match.`,
      interpretation: `${process >= 0 ? "Results have supporting process signals" : "Results lack supporting process signals"} within this sample.`,
      evidence: [
        {
          label: "Consistency",
          value: formatMetric(team.consistency, "percent"),
        },
        { label: "xG balance / match", value: process.toFixed(2) },
      ],
      confidence: confidenceFromCoverage(team.coverage),
      coverage: team.coverage,
      limitation:
        "The sample does not model injuries, schedule difficulty, or tactical changes.",
      tone: process >= 0 ? "positive" : "caution",
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
      const reasons = [
        `Performance signal ${formatMetric(player.performance, "integer")}/100`,
        `Opportunity signal ${formatMetric(player.opportunity, "integer")}/100`,
      ];
      return {
        playerId: player.id,
        playerName: player.name,
        teamName: teamNames.get(player.teamId) ?? "Unknown sample club",
        position: player.position,
        role: player.role,
        age: player.age,
        minutes: player.minutes,
        score: Math.round(score),
        reasons,
        risk:
          player.age <= 21
            ? "Development sample remains short."
            : "No market-value source is available.",
        coverage: player.coverage,
        confidence: confidenceFromCoverage(player.coverage),
      };
    })
    .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId))
    .slice(0, 5);
}

export function buildRoleSupply(dataset: LeagueDataset): RoleSupply[] {
  const counts = new Map<string, number>();
  dataset.players
    .filter((player) => player.minutes >= 450)
    .forEach((player) =>
      counts.set(player.role, (counts.get(player.role) ?? 0) + 1),
    );
  const maximum = Math.max(...counts.values());
  return [...counts.entries()]
    .map(([role, count]) => ({
      role,
      count,
      share: Math.round((count / maximum) * 100),
      status:
        count <= 2
          ? ("scarce" as const)
          : count >= 4
            ? ("abundant" as const)
            : ("balanced" as const),
    }))
    .sort((a, b) => a.count - b.count || a.role.localeCompare(b.role));
}

export function buildAnalystBrief(dataset: LeagueDataset): AnalystFinding[] {
  const process = buildPerformanceProcess(dataset)[0];
  const sustainability = buildSustainabilityWatch(dataset)[0];
  const leader = buildLeagueState(dataset)[0];
  const leagueFinding: EvidenceItem = {
    id: `leader-${leader.teamId}`,
    title: `${leader.teamName} sets the current competitive benchmark`,
    observation: `${leader.teamName} leads this sample at ${leader.pointsPerMatch.toFixed(2)} points per match.`,
    interpretation:
      "The lead is supported by positive goal balance, but remains descriptive rather than predictive.",
    evidence: [
      { label: "Points / match", value: leader.pointsPerMatch.toFixed(2) },
      {
        label: "Goal difference / 90",
        value: leader.goalDifferencePer90.toFixed(2),
      },
    ],
    confidence: confidenceFromCoverage(leader.coverage),
    coverage: leader.coverage,
    limitation: "League strength and schedule difficulty are not adjusted.",
    tone: "positive",
  };
  return [leagueFinding, process, sustainability].map((finding, index) => ({
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
  const nullableTeamValues = dataset.teams.flatMap((team) => [
    team.expectedGoals,
    team.expectedGoalsAgainst,
    team.possessionPct,
    team.defensiveActionsPer90,
    team.consistency,
  ]);
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
    missingMetricCount: nullableTeamValues.filter((value) => value === null)
      .length,
  };
}
