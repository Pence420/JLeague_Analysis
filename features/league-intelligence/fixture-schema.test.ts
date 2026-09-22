import { describe, expect, it } from "vitest";
import { leagueDatasetSchema } from "./fixture-schema";
import { sampleLeagueDataset } from "./sample-data";

describe("league fixture schema", () => {
  it("rejects duplicate team ids", () => {
    const duplicate = {
      ...sampleLeagueDataset,
      teams: [...sampleLeagueDataset.teams, sampleLeagueDataset.teams[0]],
    };
    expect(leagueDatasetSchema.safeParse(duplicate).success).toBe(false);
  });

  it("rejects coverage outside zero to one hundred", () => {
    const invalid = {
      ...sampleLeagueDataset,
      teams: sampleLeagueDataset.teams.map((team, index) =>
        index === 0 ? { ...team, coverage: 101 } : team,
      ),
    };
    expect(leagueDatasetSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts null for an unavailable analytical metric", () => {
    const valid = {
      ...sampleLeagueDataset,
      teams: sampleLeagueDataset.teams.map((team, index) =>
        index === 0 ? { ...team, expectedGoals: null } : team,
      ),
    };
    expect(leagueDatasetSchema.safeParse(valid).success).toBe(true);
  });
});
