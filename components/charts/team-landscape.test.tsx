import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildTeamLandscape,
  DEFAULT_AXES,
} from "@/features/league-intelligence/analytics";
import { sampleLeagueDataset } from "@/features/league-intelligence/sample-data";
import { TeamPerformanceChart } from "./team-performance-chart";

const points = buildTeamLandscape(sampleLeagueDataset, DEFAULT_AXES);

describe("TeamPerformanceChart", () => {
  it("renders all clubs as interactive bars and complete tabular data", () => {
    render(
      <TeamPerformanceChart
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={null}
        onSelectTeam={() => undefined}
        forceFallback
      />,
    );
    expect(
      screen.getAllByRole("button", { name: /Points$/i }),
    ).toHaveLength(points.length);
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(points.length + 1);
  });

  it("selects a team from the accessible table", async () => {
    const user = userEvent.setup();
    const onSelectTeam = vi.fn();
    render(
      <TeamPerformanceChart
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={null}
        onSelectTeam={onSelectTeam}
        forceFallback
      />,
    );
    await user.click(screen.getByRole("button", { name: points[0].teamName }));
    expect(onSelectTeam).toHaveBeenCalledWith(points[0].teamId);
  });

  it("describes all selected axes", () => {
    render(
      <TeamPerformanceChart
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={points[0].teamId}
        onSelectTeam={() => undefined}
        forceFallback
      />,
    );
    expect(
      screen.getByText(
        /points, goals scored, and goal difference/i,
      ),
    ).toBeVisible();
  });

  it("selects a club directly from the chart", async () => {
    const user = userEvent.setup();
    const onSelectTeam = vi.fn();
    render(
      <TeamPerformanceChart
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={null}
        onSelectTeam={onSelectTeam}
      />,
    );
    await user.click(
      screen.getByRole("button", {
        name: `${points[0].teamName}: ${points[0].raw.points} Points`,
      }),
    );
    expect(onSelectTeam).toHaveBeenCalledWith(points[0].teamId);
  });
});
