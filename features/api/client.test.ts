import { describe, expect, it } from "vitest";
import { adaptApiPlayer } from "./client";

describe("API player adapter", () => {
  it("preserves official nulls and the methodology version", () => {
    const player = adaptApiPlayer(
      {
        id: 44,
        source_player_id: "123",
        name: "TRANSFER Player",
        name_ja: "移籍 選手",
        club_id: 1,
        club_name: "Kashima Antlers",
        age: 25,
        position: "MF",
        role: "Midfielder",
        minutes: 900,
        appearances: 10,
        goals: 1,
        jersey_number: 8,
        birth_date: "2000-01-01",
        height_cm: 180,
        weight_kg: 72,
        performance: null,
        potential: null,
        opportunity: null,
        availability: null,
        coverage: 100,
        official_metrics: {
          tackles: {
            value: null,
            unit: "count",
            per90: null,
            listing_status: "not_listed",
            source_rank: null,
            source_url: "https://example.test/tackles",
            retrieved_at: "2025-12-06T00:00:00Z",
          },
        },
        derived_scores: {
          status: "not_scored",
          role_performance: null,
          opportunity: 72.5,
          development: 72,
          availability: 26.32,
          confidence: 62.5,
          value_proxy: null,
          methodology_version: "jleague-official-2025.3",
          metrics_used: [],
          metrics_unavailable: ["tackles"],
          reasons: ["insufficient_role_metrics"],
          limitations: [],
        },
      },
      new Map([[1, "kashima"]]),
    );

    expect(player.officialMetrics.tackles?.value).toBeNull();
    expect(player.derivedScores.methodologyVersion).toBe(
      "jleague-official-2025.3",
    );
    expect(player.derivedScores.opportunity).toBe(72.5);
    expect(player.derivedScores.availability).toBe(26.32);
    expect(player.derivedScores.valueProxy).toBeNull();
  });
});
