import type { PlayerMetricKey, PlayerPosition } from "./types";

export const METRIC_LABELS: Record<PlayerMetricKey, string> = {
  non_penalty_xg: "Non-penalty xG",
  goals: "Goals",
  assists: "Assists",
  chances_created: "Chances created",
  shots_on_target_rate: "Shots on target",
  dribble_success: "Dribble success",
  duels_won_per90: "Duels won / 90",
  opposition_half_pass_completion: "Opposition-half passing",
  through_passes: "Through passes",
  interceptions: "Interceptions",
  goals_minus_xg: "Goals − xG",
  aerial_duel_win_rate: "Aerial duel win rate",
  tackles: "Tackles",
  tackle_success: "Tackle success",
  clearances: "Clearances",
  blocks: "Blocks",
  pass_completion: "Pass completion",
  save_rate: "Save rate",
  penalty_area_save_rate: "Penalty-area save rate",
  saves_per90: "Saves / 90",
  cross_claim_rate: "Cross claim rate",
  clean_sheet_rate: "Clean-sheet rate",
  distribution_completion: "Distribution completion",
};

export const POSITION_EVIDENCE: Record<PlayerPosition, PlayerMetricKey[]> = {
  GK: [
    "save_rate",
    "penalty_area_save_rate",
    "saves_per90",
    "cross_claim_rate",
  ],
  DF: [
    "duels_won_per90",
    "aerial_duel_win_rate",
    "interceptions",
    "tackle_success",
  ],
  MF: [
    "chances_created",
    "opposition_half_pass_completion",
    "through_passes",
    "interceptions",
  ],
  FW: ["non_penalty_xg", "goals", "chances_created", "shots_on_target_rate"],
};

export function formatOfficialMetric(
  value: number | null,
  unit: string,
): string {
  if (value === null) return "Not listed";
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "per90") return value.toFixed(2);
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toFixed(2);
}
