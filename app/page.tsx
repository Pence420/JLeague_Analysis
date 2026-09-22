"use client";

import dynamic from "next/dynamic";
import { IslandNav } from "@/components/app-shell/island-nav";
import { AnalystBrief } from "@/components/dashboard/analyst-brief";
import { ContextHeader } from "@/components/dashboard/context-header";
import { DataConfidence } from "@/components/dashboard/data-confidence";
import { LeagueState } from "@/components/dashboard/league-state";
import { PerformanceProcess } from "@/components/dashboard/performance-process";
import { RecruitmentSignals } from "@/components/dashboard/recruitment-signals";
import { RoleSupplyMap } from "@/components/dashboard/role-supply-map";
import { SustainabilityWatch } from "@/components/dashboard/sustainability-watch";
import { useLeagueDashboard } from "@/features/league-intelligence/use-league-dashboard";

const TeamLandscape = dynamic(() => import("@/components/charts/team-landscape-3d").then((module) => module.TeamLandscape), { ssr: false, loading: () => <div className="surface-card grid min-h-[540px] place-items-center text-sm text-[var(--ink-muted)]">Preparing interactive 3D landscape…</div> });

export default function Home() {
  const dashboard = useLeagueDashboard();
  const { dataset, viewModel } = dashboard;
  return (
    <>
      <IslandNav activeHref="/" />
      <main className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-7 md:pb-12">
        <ContextHeader snapshotDate={dataset.snapshotDate} methodologyVersion={dataset.methodologyVersion} minimumMinutes={dashboard.minimumMinutes} onMinimumMinutesChange={dashboard.setMinimumMinutes} />
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="order-2 xl:order-1 xl:col-span-4"><LeagueState rows={viewModel.leagueState} onSelectTeam={dashboard.setSelectedTeamId} /></div>
          <div className="order-1 xl:order-2 xl:col-span-8"><TeamLandscape points={viewModel.landscape} axes={dashboard.axes} selectedTeamId={dashboard.selectedTeamId} onSelectTeam={dashboard.setSelectedTeamId} onAxisChange={dashboard.setAxis} /></div>
          <div className="order-3 xl:col-span-4"><PerformanceProcess items={viewModel.performanceProcess} /></div>
          <div className="order-4 xl:col-span-4"><SustainabilityWatch items={viewModel.sustainability} /></div>
          <div className="order-5 xl:col-span-4"><DataConfidence averageCoverage={viewModel.averageCoverage} missingMetricCount={viewModel.missingMetricCount} snapshotDate={dataset.snapshotDate} methodologyVersion={dataset.methodologyVersion} minimumMinutes={dashboard.minimumMinutes} /></div>
          <div className="order-6 xl:col-span-8"><RecruitmentSignals items={viewModel.recruitmentSignals} /></div>
          <div className="order-7 xl:col-span-4"><RoleSupplyMap items={viewModel.roleSupply} /></div>
          <div className="order-8 xl:col-span-12"><AnalystBrief findings={viewModel.analystBrief} /></div>
        </div>
        <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] py-6 text-xs font-semibold text-[var(--ink-muted)]"><span>J-SCOUT · J1 2025 LEAGUE INTELLIGENCE</span><span>SYNTHETIC SAMPLE DATA · NOT FOR RECRUITMENT DECISIONS</span></footer>
      </main>
    </>
  );
}
