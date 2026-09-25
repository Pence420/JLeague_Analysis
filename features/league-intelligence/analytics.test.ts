import { describe, expect, it } from "vitest";
import {
  buildLeagueState,
  buildRecruitmentSignals,
  buildTeamLandscape,
  confidenceFromCoverage,
  DEFAULT_AXES,
  formatMetric,
  per90,
  weightedValueProxy,
} from "./analytics";
import { parseMetric } from "./fixture-schema";
import { sampleLeagueDataset } from "./sample-data";

describe("league analytics", () => {
  it("normalizes count metrics per 90 without inventing missing values", () => {
    expect(per90(18, 900)).toBe(1.8);
    expect(per90(null, 900)).toBeNull();
    expect(per90(3, 0)).toBeNull();
  });

  it("formats missing metrics explicitly", () => {
    expect(formatMetric(null, "decimal")).toBe("Not available");
  });

  it("keeps a listed zero distinct from an absent leaderboard row", () => {
    expect(
      parseMetric({
        value: 0,
        unit: "count",
        per90: 0,
        listingStatus: "listed",
        sourceRank: 200,
        sourceUrl: "https://example.test",
        retrievedAt: "2025-12-06T00:00:00Z",
      }).value,
    ).toBe(0);
    expect(
      parseMetric({
        value: null,
        unit: "count",
        per90: null,
        listingStatus: "not_listed",
        sourceRank: null,
        sourceUrl: "https://example.test",
        retrievedAt: "2025-12-06T00:00:00Z",
      }).value,
    ).toBeNull();
    expect(() =>
      parseMetric({
        value: 0,
        unit: "count",
        per90: 0,
        listingStatus: "not_listed",
        sourceRank: null,
        sourceUrl: "https://example.test",
        retrievedAt: "2025-12-06T00:00:00Z",
      }),
    ).toThrow();
  });

  it("reweights canonical components without recreating role performance", () => {
    const score = weightedValueProxy(
      {
        status: "scored",
        rolePerformance: 70,
        opportunity: 60,
        development: 50,
        availability: 80,
        confidence: 100,
        valueProxy: 67.5,
        methodologyVersion: "jleague-official-2025.3",
        metricsUsed: ["assists"],
        metricsUnavailable: [],
        reasons: [],
        limitations: [],
      },
      {
        rolePerformance: 50,
        opportunity: 20,
        development: 15,
        availability: 10,
        confidence: 5,
      },
    );
    expect(score).toBe(67.5);
  });

  it("classifies confidence at the documented thresholds", () => {
    expect(confidenceFromCoverage(79)).toBe("low");
    expect(confidenceFromCoverage(80)).toBe("medium");
    expect(confidenceFromCoverage(90)).toBe("high");
  });

  it("excludes low-minute and low-coverage players from default recruitment signals", () => {
    const signals = buildRecruitmentSignals(sampleLeagueDataset, {
      minimumMinutes: 900,
    });
    expect(signals.every((item) => item.minutes >= 900)).toBe(true);
    expect(signals.every((item) => item.coverage >= 60)).toBe(true);
  });

  it("includes all 20 official clubs in the table and performance landscape", () => {
    expect(buildLeagueState(sampleLeagueDataset)).toHaveLength(20);
    expect(buildTeamLandscape(sampleLeagueDataset, DEFAULT_AXES)).toHaveLength(
      20,
    );
    expect(buildLeagueState(sampleLeagueDataset)[0]).toMatchObject({
      teamName: "Kashima Antlers",
      points: 76,
      rank: 1,
    });
  });
});
