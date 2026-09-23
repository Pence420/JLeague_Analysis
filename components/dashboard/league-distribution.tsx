import type { LeagueStateRow } from "@/features/league-intelligence/types";

const bands = [
  { label: "Title race", start: 1, end: 3 },
  { label: "Upper half", start: 4, end: 10 },
  { label: "Mid-table", start: 11, end: 17 },
  { label: "Bottom three", start: 18, end: 20 },
] as const;

export function LeagueDistribution({ rows }: { rows: LeagueStateRow[] }) {
  const groups = bands.map((band) => {
    const clubs = rows.filter(
      (row) => row.rank >= band.start && row.rank <= band.end,
    );
    const points = clubs.map((club) => club.points);
    return {
      ...band,
      clubs,
      high: Math.max(...points),
      low: Math.min(...points),
    };
  });

  return (
    <section
      className="surface-card flex-1 p-5"
      aria-labelledby="league-distribution-title"
    >
      <p className="eyebrow">Table shape</p>
      <h2 id="league-distribution-title" className="module-title">
        League distribution
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
        How the final table separates into competitive bands.
      </p>

      <div className="mt-5 grid gap-2">
        {groups.map((group, index) => (
          <article
            key={group.label}
            className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-t border-[var(--line)] py-3 first:border-t-0 first:pt-0"
          >
            <span className="grid size-9 place-items-center rounded-md bg-[var(--surface-soft)] text-xs font-bold tabular-nums text-[var(--ink-muted)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-sm font-semibold">{group.label}</h3>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Ranks {group.start}–{group.end} · {group.clubs.length} clubs
              </p>
            </div>
            <div className="text-right tabular-nums">
              <strong className="block text-sm">
                {group.low}–{group.high}
              </strong>
              <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                points
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
