import type { LeagueStateRow } from "@/features/league-intelligence/types";

export function LeagueState({
  rows,
  onSelectTeam,
}: {
  rows: LeagueStateRow[];
  onSelectTeam: (teamId: string) => void;
}) {
  return (
    <section
      className="surface-card h-full p-5"
      aria-labelledby="league-state-title"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Competitive state</p>
          <h2 id="league-state-title" className="module-title">
            Final Table
          </h2>
        </div>
        <span className="text-xs text-[var(--ink-muted)]">J1 · 2025</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
            <tr>
              <th className="pb-3">Club</th>
              <th className="pb-3 text-right">P</th>
              <th className="pb-3 text-right">W-D-L</th>
              <th className="pb-3 text-right">GD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teamId} className="border-t border-[var(--line)]">
                <td className="py-3">
                  <button
                    onClick={() => onSelectTeam(row.teamId)}
                    className="text-left font-semibold hover:text-[var(--red)]"
                  >
                    <span className="mr-2 text-xs text-[var(--ink-muted)]">
                      {String(row.rank).padStart(2, "0")}
                    </span>
                    {row.teamName}
                  </button>
                </td>
                <td className="py-3 text-right tabular-nums">
                  {row.points}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {row.wins}-{row.draws}-{row.losses}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}
                  {row.goalsFor - row.goalsAgainst}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
