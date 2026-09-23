"use client";

import dynamic from "next/dynamic";
import { IslandNav } from "@/components/app-shell/island-nav";
import { AnalystBrief } from "@/components/dashboard/analyst-brief";
import { ContextHeader } from "@/components/dashboard/context-header";
import { DataConfidence } from "@/components/dashboard/data-confidence";
import { LeagueDistribution } from "@/components/dashboard/league-distribution";
import { LeagueState } from "@/components/dashboard/league-state";
import { RecruitmentSignals } from "@/components/dashboard/recruitment-signals";
import { useLeagueDashboard } from "@/features/league-intelligence/use-league-dashboard";

const TeamPerformanceChart = dynamic(
  () =>
    import("@/components/charts/team-performance-chart").then(
      (module) => module.TeamPerformanceChart,
    ),
  {
    loading: () => (
      <div className="surface-card grid min-h-[540px] place-items-center text-sm text-[var(--ink-muted)]">
        Preparing club performance chart…
      </div>
    ),
  },
);

export default function Home() {
  const dashboard = useLeagueDashboard();
  const { dataset, viewModel } = dashboard;
  return (
    <>
      <IslandNav activeHref="/" />
      <main className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-7 md:pb-12">
        <ContextHeader />
        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Season summary">
          {[
            ["Champions", dataset.teams[0].name, `${dataset.teams[0].points} points`],
            ["Title margin", `${dataset.teams[0].points - dataset.teams[1].points} point`, `over ${dataset.teams[1].name}`],
            ["Player records", dataset.players.length.toLocaleString("en-US"), "official club-season records"],
            ["Season coverage", "380 matches", "20 clubs · 38 matches each"],
          ].map(([label, value, note]) => (
            <article key={label} className="surface-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</p>
              <strong className="mt-2 block text-2xl font-semibold tracking-[-0.03em]">{value}</strong>
              <span className="mt-1 block text-xs text-[var(--ink-muted)]">{note}</span>
            </article>
          ))}
        </section>
        <div className="grid gap-3 xl:grid-cols-12">
          <div className="order-1 min-w-0 xl:col-span-8">
            <TeamPerformanceChart
              points={viewModel.landscape}
              axes={dashboard.axes}
              selectedTeamId={dashboard.selectedTeamId}
              onSelectTeam={dashboard.setSelectedTeamId}
              onAxisChange={dashboard.setAxis}
            />
          </div>
          <div className="order-2 xl:col-span-4">
            <LeagueState
              rows={viewModel.leagueState}
              onSelectTeam={dashboard.setSelectedTeamId}
            />
          </div>
          <div className="order-3 flex flex-col gap-3 xl:col-span-4">
            <DataConfidence
              averageCoverage={viewModel.averageCoverage}
              missingMetricCount={viewModel.missingMetricCount}
              snapshotDate={dataset.snapshotDate}
              methodologyVersion={dataset.methodologyVersion}
              minimumMinutes={dashboard.minimumMinutes}
            />
            <LeagueDistribution rows={viewModel.leagueState} />
          </div>
          <div className="order-4 xl:col-span-8">
            <RecruitmentSignals items={viewModel.recruitmentSignals} />
          </div>
          <div className="order-5 xl:col-span-12">
            <AnalystBrief findings={viewModel.analystBrief} />
          </div>
        </div>
        <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] py-6 text-xs font-semibold text-[var(--ink-muted)]">
          <span>J-SCOUT · J1 2025 LEAGUE INTELLIGENCE</span>
          <span>OFFICIAL J.LEAGUE 2025 RESULTS · DERIVED SCORES ARE LABELED</span>
        </footer>
      </main>
    </>
  );
}
