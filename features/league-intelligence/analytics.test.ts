import { describe, expect, it } from "vitest";
import {
  buildLeagueState,
  buildRecruitmentSignals,
  buildTeamLandscape,
  confidenceFromCoverage,
  DEFAULT_AXES,
  formatMetric,
  per90,
} from "./analytics";
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

  it("includes all 20 official clubs in the table and 3D landscape", () => {
    expect(buildLeagueState(sampleLeagueDataset)).toHaveLength(20);
    expect(buildTeamLandscape(sampleLeagueDataset, DEFAULT_AXES)).toHaveLength(20);
    expect(buildLeagueState(sampleLeagueDataset)[0]).toMatchObject({
      teamName: "Kashima Antlers",
      points: 76,
      rank: 1,
    });
  });
});
