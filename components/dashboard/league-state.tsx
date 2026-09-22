import type { LeagueStateRow } from "@/features/league-intelligence/types";
import { MetricValue } from "@/components/ui/metric-value";

export function LeagueState({ rows, onSelectTeam }: { rows: LeagueStateRow[]; onSelectTeam: (teamId: string) => void }) {
  return (
    <section className="surface-card h-full p-5" aria-labelledby="league-state-title">
      <div className="flex items-end justify-between"><div><p className="eyebrow">Competitive state</p><h2 id="league-state-title" className="module-title">League State</h2></div><span className="text-xs text-[var(--ink-muted)]">J1 · 2025</span></div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm"><thead className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]"><tr><th className="pb-3">Club</th><th className="pb-3 text-right">PPM</th><th className="pb-3 text-right">GD/90</th><th className="pb-3 text-right">xGD/90</th></tr></thead><tbody>{rows.slice(0, 8).map((row, index) => <tr key={row.teamId} className="border-t border-[var(--line)]"><td className="py-3"><button onClick={() => onSelectTeam(row.teamId)} className="text-left font-semibold hover:text-[var(--red)]"><span className="mr-2 text-xs text-[var(--ink-muted)]">{String(index + 1).padStart(2, "0")}</span>{row.teamName}</button></td><td className="py-3 text-right tabular-nums">{row.pointsPerMatch.toFixed(2)}</td><td className="py-3 text-right tabular-nums">{row.goalDifferencePer90.toFixed(2)}</td><td className="py-3 text-right tabular-nums"><MetricValue value={row.expectedGoalDifferencePer90} format="decimal" label={`${row.teamName} expected goal difference`} /></td></tr>)}</tbody></table>
      </div>
    </section>
  );
}
