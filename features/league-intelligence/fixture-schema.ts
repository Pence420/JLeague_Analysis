import { z } from "zod";

const nullableScore = z.number().min(0).max(100).nullable();
const positionSchema = z.enum(["GK", "CB", "FB/WB", "DM", "CM", "AM", "W", "ST"]);

const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  shortName: z.string().min(2).max(5),
  played: z.number().int().positive(),
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
  teamId: z.string().min(1),
  position: positionSchema,
  role: z.string().min(2),
  age: z.number().int().min(16).max(45),
  minutes: z.number().int().nonnegative(),
  performance: nullableScore,
  potential: nullableScore,
  opportunity: nullableScore,
  availability: nullableScore,
  coverage: z.number().min(0).max(100),
});

export const leagueDatasetSchema = z
  .object({
    competition: z.literal("J1"),
    season: z.literal(2025),
    snapshotDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid snapshot date"),
    methodologyVersion: z.string().min(1),
    sample: z.literal(true),
    teams: z.array(teamSchema).min(4),
    players: z.array(playerSchema).min(4),
  })
  .superRefine((dataset, context) => {
    const teamIds = dataset.teams.map((team) => team.id);
    const playerIds = dataset.players.map((player) => player.id);
    if (new Set(teamIds).size !== teamIds.length) {
      context.addIssue({ code: "custom", path: ["teams"], message: "Team ids must be unique" });
    }
    if (new Set(playerIds).size !== playerIds.length) {
      context.addIssue({ code: "custom", path: ["players"], message: "Player ids must be unique" });
    }
    const validTeams = new Set(teamIds);
    dataset.players.forEach((player, index) => {
      if (!validTeams.has(player.teamId)) {
        context.addIssue({ code: "custom", path: ["players", index, "teamId"], message: "Player team must exist" });
      }
    });
  });
