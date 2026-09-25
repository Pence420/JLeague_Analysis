import { z } from "zod";

const nullableScore = z.number().min(0).max(100).nullable();
const positionSchema = z.enum(["GK", "DF", "MF", "FW"]);
const playerMetricKeySchema = z.enum([
  "non_penalty_xg",
  "goals",
  "assists",
  "chances_created",
  "shots_on_target_rate",
  "dribble_success",
  "duels_won_per90",
  "opposition_half_pass_completion",
  "through_passes",
  "interceptions",
  "goals_minus_xg",
  "aerial_duel_win_rate",
  "tackles",
  "tackle_success",
  "clearances",
  "blocks",
  "pass_completion",
  "save_rate",
  "penalty_area_save_rate",
  "saves_per90",
  "cross_claim_rate",
  "clean_sheet_rate",
  "distribution_completion",
]);

export const officialMetricSchema = z
  .object({
    value: z.number().nullable(),
    unit: z.string().min(1),
    per90: z.number().nullable(),
    listingStatus: z.enum(["listed", "not_listed", "unavailable"]),
    sourceRank: z.number().int().positive().nullable(),
    sourceUrl: z.string().url(),
    retrievedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  })
  .superRefine((metric, context) => {
    if (metric.listingStatus === "listed" && metric.value === null) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Listed metrics require a value",
      });
    }
    if (metric.listingStatus !== "listed" && metric.value !== null) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Unlisted metrics must remain null",
      });
    }
  });

export function parseMetric(input: unknown) {
  return officialMetricSchema.parse(input);
}

const derivedScoresSchema = z.object({
  status: z.enum(["scored", "ineligible", "not_scored"]),
  rolePerformance: nullableScore,
  opportunity: nullableScore,
  development: nullableScore,
  availability: nullableScore,
  confidence: nullableScore,
  valueProxy: nullableScore,
  methodologyVersion: z.string().min(1),
  metricsUsed: z.array(playerMetricKeySchema),
  metricsUnavailable: z.array(playerMetricKeySchema),
  reasons: z.array(z.string()),
  limitations: z.array(z.string()),
});

const unavailableDerivedScores = {
  status: "not_scored" as const,
  rolePerformance: null,
  opportunity: null,
  development: null,
  availability: null,
  confidence: null,
  valueProxy: null,
  methodologyVersion: "jleague-official-2025.3",
  metricsUsed: [],
  metricsUnavailable: [],
  reasons: ["official_advanced_metrics_not_approved"],
  limitations: ["Advanced J STATS values are not published in this snapshot."],
};

const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  nameJa: z.string().min(2),
  shortName: z.string().min(2).max(5),
  rank: z.number().int().min(1).max(20),
  played: z.number().int().positive(),
  wins: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),
  expectedGoals: z.number().nonnegative().nullable(),
  expectedGoalsAgainst: z.number().nonnegative().nullable(),
  possessionPct: z.number().min(0).max(100).nullable(),
  defensiveActionsPer90: z.number().nonnegative().nullable(),
  consistency: nullableScore,
  coverage: z.number().min(0).max(100),
});

const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  nameJa: z.string().min(1),
  teamId: z.string().min(1),
  position: positionSchema,
  role: z.string().min(2),
  age: z.number().int().min(16).max(45),
  minutes: z.number().int().nonnegative(),
  appearances: z.number().int().nonnegative(),
  goals: z.number().int().nonnegative(),
  jerseyNumber: z.number().int().nonnegative(),
  birthDate: z.string().min(8),
  heightCm: z.number().int().positive().nullable(),
  weightKg: z.number().int().positive().nullable(),
  coverage: z.number().min(0).max(100),
  officialMetrics: z
    .partialRecord(playerMetricKeySchema, officialMetricSchema)
    .default({}),
  derivedScores: derivedScoresSchema.default(unavailableDerivedScores),
});

export const leagueDatasetSchema = z
  .object({
    competition: z.literal("J1"),
    season: z.literal(2025),
    snapshotDate: z
      .string()
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Invalid snapshot date",
      ),
    methodologyVersion: z.string().min(1),
    sample: z.literal(false),
    provenance: z
      .object({
        publisher: z.string(),
        source: z.string(),
        retrievedAt: z.string(),
        standingsUrl: z.string().url(),
        playerDirectoryUrl: z.string().url(),
        appearanceRecordPattern: z.string().url(),
        notes: z.array(z.string()),
        unmatchedIdentities: z.array(z.string()),
      })
      .optional(),
    teams: z.array(teamSchema).length(20),
    players: z.array(playerSchema).min(500),
  })
  .superRefine((dataset, context) => {
    const teamIds = dataset.teams.map((team) => team.id);
    const playerIds = dataset.players.map((player) => player.id);
    if (new Set(teamIds).size !== teamIds.length) {
      context.addIssue({
        code: "custom",
        path: ["teams"],
        message: "Team ids must be unique",
      });
    }
    if (new Set(playerIds).size !== playerIds.length) {
      context.addIssue({
        code: "custom",
        path: ["players"],
        message: "Player ids must be unique",
      });
    }
    const validTeams = new Set(teamIds);
    dataset.players.forEach((player, index) => {
      if (!validTeams.has(player.teamId)) {
        context.addIssue({
          code: "custom",
          path: ["players", index, "teamId"],
          message: "Player team must exist",
        });
      }
    });
  });
