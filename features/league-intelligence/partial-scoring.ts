import type { LeagueDataset, PlayerSeason } from "./types";

function percentileRank(value: number, values: number[]): number {
  const lower = values.filter((item) => item < value).length;
  const equal = values.filter((item) => item === value).length;
  return ((lower + 0.5 * equal) / values.length) * 100;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function partialScores(
  player: PlayerSeason,
  peers: PlayerSeason[],
  maximumMinutes: number,
): PlayerSeason["derivedScores"] {
  if (player.minutes < 450) {
    return {
      ...player.derivedScores,
      status: "ineligible",
      methodologyVersion: "jleague-official-2025.3",
      reasons: ["below_minimum_minutes"],
    };
  }

  const minuteUsage = percentileRank(
    player.minutes,
    peers.map((item) => item.minutes),
  );
  const appearanceUsage = percentileRank(
    player.appearances,
    peers.map((item) => item.appearances),
  );
  const opportunity = 100 - (0.7 * minuteUsage + 0.3 * appearanceUsage);
  const development = Math.max(
    0,
    Math.min(100, 100 - Math.max(0, player.age - 18) * 4),
  );
  const maximumAppearances = maximumMinutes / 90;
  const minuteShare = Math.min(100, (player.minutes / maximumMinutes) * 100);
  const appearanceShare = Math.min(
    100,
    (player.appearances / maximumAppearances) * 100,
  );
  const availability = 0.7 * minuteShare + 0.3 * appearanceShare;
  const sampleReliability = Math.min(100, (player.minutes / 1800) * 100);
  const confidence = 0.45 * player.coverage + 0.35 * sampleReliability;

  return {
    status: "not_scored",
    rolePerformance: null,
    opportunity: round(opportunity),
    development: round(development),
    availability: round(availability),
    confidence: round(confidence),
    valueProxy: null,
    methodologyVersion: "jleague-official-2025.3",
    metricsUsed: [],
    metricsUnavailable: player.derivedScores.metricsUnavailable,
    reasons: ["insufficient_role_metrics"],
    limitations: [
      "Development is an age-runway proxy until official role metrics are available.",
      "The final Recruitment Value Proxy remains unavailable without role performance.",
    ],
  };
}

export function withBaseDataScores(dataset: LeagueDataset): LeagueDataset {
  const peersByPosition = new Map<string, PlayerSeason[]>();
  dataset.players.forEach((player) => {
    const peers = peersByPosition.get(player.position) ?? [];
    peers.push(player);
    peersByPosition.set(player.position, peers);
  });
  const maximumMinutesByTeam = new Map(
    dataset.teams.map((team) => [team.id, team.played * 90]),
  );

  return {
    ...dataset,
    methodologyVersion: "jleague-official-2025.3",
    players: dataset.players.map((player) => ({
      ...player,
      derivedScores: partialScores(
        player,
        peersByPosition.get(player.position) ?? [player],
        maximumMinutesByTeam.get(player.teamId) ?? 3420,
      ),
    })),
  };
}
