import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContextHeader } from "./context-header";
import { LeagueDistribution } from "./league-distribution";
import { MetricValue } from "@/components/ui/metric-value";
import { buildLeagueState } from "@/features/league-intelligence/analytics";
import { sampleLeagueDataset } from "@/features/league-intelligence/sample-data";

describe("League overview context", () => {
  it("keeps the league header focused on page context", () => {
    render(<ContextHeader />);
    expect(screen.getByRole("heading", { name: /league overview/i })).toBeVisible();
    expect(screen.queryByText(/api connected/i)).not.toBeInTheDocument();
  });

  it("summarizes all four final-table bands", () => {
    render(<LeagueDistribution rows={buildLeagueState(sampleLeagueDataset)} />);
    expect(screen.getByRole("heading", { name: /league distribution/i })).toBeVisible();
    expect(screen.getByText("Title race")).toBeVisible();
    expect(screen.getByText("Bottom three")).toBeVisible();
    expect(screen.getByText(/ranks 18–20 · 3 clubs/i)).toBeVisible();
  });

  it("renders absent metrics as Not available", () => {
    render(
      <MetricValue value={null} format="decimal" label="Unavailable metric" />,
    );
    expect(screen.getByText("Not available")).toBeVisible();
  });
});
