import { describe, expect, it } from "vitest";
import snapshot from "@/data/jleague/2025.json";
import { leagueDatasetSchema } from "./fixture-schema";
import { withBaseDataScores } from "./partial-scoring";

describe("local fallback partial scoring", () => {
  it("keeps the final proxy withheld while exposing base-data components", () => {
    const dataset = withBaseDataScores(leagueDatasetSchema.parse(snapshot));
    const player = dataset.players.find((item) => item.minutes >= 900);

    expect(player).toBeDefined();
    expect(player?.derivedScores.status).toBe("not_scored");
    expect(player?.derivedScores.rolePerformance).toBeNull();
    expect(player?.derivedScores.opportunity).not.toBeNull();
    expect(player?.derivedScores.development).not.toBeNull();
    expect(player?.derivedScores.availability).not.toBeNull();
    expect(player?.derivedScores.confidence).not.toBeNull();
    expect(player?.derivedScores.valueProxy).toBeNull();
  });
});
