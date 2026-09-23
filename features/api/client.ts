import { leagueDatasetSchema } from "@/features/league-intelligence/fixture-schema";
import type { LeagueDataset } from "@/features/league-intelligence/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

type ApiOverview = {
  competition: "J1";
  season: 2025;
  snapshot_date: string;
  methodology_version: string;
  sample: false;
};
type ApiTeam = {
  id: number;
  slug: string;
  name: string;
  name_ja: string;
  short_name: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goals_for: number;
  goals_against: number;
  expected_goals: number | null;
  expected_goals_against: number | null;
  possession_pct: number | null;
  defensive_actions_per90: number | null;
  consistency: number | null;
  coverage: number;
};
type ApiPlayer = {
  source_player_id: string;
  name: string;
  name_ja: string;
  club_id: number;
  age: number;
  position: LeagueDataset["players"][number]["position"];
  role: string;
  minutes: number;
  appearances: number;
  goals: number;
  jersey_number: number;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  performance: number | null;
  potential: number | null;
  opportunity: number | null;
  availability: number | null;
  coverage: number;
};
type ApiPlayerPage = { items: ApiPlayer[]; next_cursor: number | null };

async function fetchAllPlayers(signal?: AbortSignal): Promise<ApiPlayer[]> {
  const players: ApiPlayer[] = [];
  let cursor: number | null = null;
  do {
    const suffix = cursor === null ? "" : `&after_id=${cursor}`;
    const page: ApiPlayerPage = await getJson<ApiPlayerPage>(
      `/api/v1/players?season=2025&limit=100${suffix}`,
      signal,
    );
    players.push(...page.items);
    cursor = page.next_cursor;
  } while (cursor !== null);
  return players;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const response = await fetch(`${apiUrl}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchLeagueDataset(
  signal?: AbortSignal,
): Promise<LeagueDataset> {
  const [overview, teams, players] = await Promise.all([
    getJson<ApiOverview>("/api/v1/league/2025/overview", signal),
    getJson<ApiTeam[]>("/api/v1/teams?season=2025", signal),
    fetchAllPlayers(signal),
  ]);
  const teamIdToSlug = new Map(teams.map((team) => [team.id, team.slug]));
  return leagueDatasetSchema.parse({
    competition: overview.competition,
    season: overview.season,
    snapshotDate: overview.snapshot_date,
    methodologyVersion: overview.methodology_version,
    sample: overview.sample,
    teams: teams.map((team) => ({
      id: team.slug,
      name: team.name,
      nameJa: team.name_ja,
      shortName: team.short_name,
      rank: team.rank,
      played: team.played,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      points: team.points,
      goalsFor: team.goals_for,
      goalsAgainst: team.goals_against,
      expectedGoals: team.expected_goals,
      expectedGoalsAgainst: team.expected_goals_against,
      possessionPct: team.possession_pct,
      defensiveActionsPer90: team.defensive_actions_per90,
      consistency: team.consistency,
      coverage: team.coverage,
    })),
    players: players.map((player) => ({
      id: player.source_player_id,
      name: player.name,
      nameJa: player.name_ja,
      teamId: teamIdToSlug.get(player.club_id) ?? "unknown-club",
      position: player.position,
      role: player.role,
      age: player.age,
      minutes: player.minutes,
      appearances: player.appearances,
      goals: player.goals,
      jerseyNumber: player.jersey_number,
      birthDate: player.birth_date ?? `${2025 - player.age}-01-01`,
      heightCm: player.height_cm,
      weightKg: player.weight_kg,
      performance: player.performance,
      potential: player.potential,
      opportunity: player.opportunity,
      availability: player.availability,
      coverage: player.coverage,
    })),
  }) as LeagueDataset;
}

export const isApiConfigured = Boolean(apiUrl);
