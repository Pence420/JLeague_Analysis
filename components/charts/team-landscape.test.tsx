import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  buildTeamLandscape,
  DEFAULT_AXES,
} from "@/features/league-intelligence/analytics";
import { sampleLeagueDataset } from "@/features/league-intelligence/sample-data";
import { TeamLandscape } from "./team-landscape-3d";

const points = buildTeamLandscape(sampleLeagueDataset, DEFAULT_AXES);

describe("TeamLandscape", () => {
  it("renders complete HTML data when WebGL is unavailable", () => {
    render(
      <TeamLandscape
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={null}
        onSelectTeam={() => undefined}
        forceFallback
      />,
    );
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(points.length + 1);
  });

  it("selects a team from the accessible table", async () => {
    const user = userEvent.setup();
    const onSelectTeam = vi.fn();
    render(
      <TeamLandscape
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
      <TeamLandscape
        points={points}
        axes={DEFAULT_AXES}
        selectedTeamId={points[0].teamId}
        onSelectTeam={() => undefined}
        forceFallback
      />,
    );
    expect(
      screen.getByText(
        /attacking output, possession control, and defensive disruption/i,
      ),
    ).toBeVisible();
  });
});
