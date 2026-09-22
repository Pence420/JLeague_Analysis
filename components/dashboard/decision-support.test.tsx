import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildLeagueDashboard,
  DEFAULT_AXES,
} from "@/features/league-intelligence/analytics";
import { sampleLeagueDataset } from "@/features/league-intelligence/sample-data";
import { AnalystBrief } from "./analyst-brief";
import { PerformanceProcess } from "./performance-process";
import { RecruitmentSignals } from "./recruitment-signals";

const viewModel = buildLeagueDashboard(sampleLeagueDataset, {
  axes: DEFAULT_AXES,
  minimumMinutes: 900,
});

describe("decision-support modules", () => {
  it("shows cautious interpretation and evidence", () => {
    render(<PerformanceProcess items={viewModel.performanceProcess} />);
    expect(screen.getByText(/within this sample/i)).toBeVisible();
    expect(screen.getByText(/show evidence/i)).toBeVisible();
  });

  it("shows reasons, risk, coverage, and confidence for recruitment signals", () => {
    render(<RecruitmentSignals items={[viewModel.recruitmentSignals[0]]} />);
    expect(
      screen.getByText(viewModel.recruitmentSignals[0].risk),
    ).toBeVisible();
    expect(screen.getByText(/coverage/i)).toBeVisible();
    expect(
      screen.getByText(
        new RegExp(
          `${viewModel.recruitmentSignals[0].confidence} confidence`,
          "i",
        ),
      ),
    ).toBeVisible();
  });

  it("renders exactly three ranked analyst findings", () => {
    const { container } = render(
      <AnalystBrief findings={viewModel.analystBrief} />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });
});
