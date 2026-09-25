import type { RecruitmentSignal } from "@/features/league-intelligence/types";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";

export function RecruitmentSignals({ items }: { items: RecruitmentSignal[] }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Position-aware recruitment model</p>
          <h2 className="module-title">Recruitment Value Proxy</h2>
        </div>
        <span className="text-xs text-[var(--ink-muted)]">
          Methodology 2025.3
        </span>
      </div>
      {items.length === 0 && (
        <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h3 className="font-semibold">Partial screening available</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
              Player identity, appearances, minutes and goals are available. The
              base records now support opportunity, age development,
              availability and confidence. Advanced J STATS inputs stay gated,
              so role performance and the final proxy are not fabricated.
            </p>
            <p className="mt-3 text-xs text-[var(--ink-muted)]">
              The proxy is a discovery aid, not a transfer valuation or scouting
              verdict.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <dt className="text-[var(--ink-muted)]">Data confidence</dt>
            <dd className="text-right font-semibold">Base data only</dd>
            <dt className="text-[var(--ink-muted)]">Score status</dt>
            <dd className="text-right font-semibold">Not scored</dd>
          </dl>
        </div>
      )}
      <div className="mt-5 divide-y divide-[var(--line)]">
        {items.slice(0, 4).map((item) => (
          <article
            key={item.playerId}
            className="grid gap-4 py-5 first:pt-0 md:grid-cols-[1.25fr_1fr_auto] md:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-xs font-black text-white">
                {item.position}
              </span>
              <div>
                <h3 className="font-bold">{item.playerName}</h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  {item.role} · {item.teamName} · Age {item.age}
                </p>
              </div>
            </div>
            <ul className="space-y-1 text-sm">
              {item.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden="true">—</span>
                  {reason}
                </li>
              ))}
              <li className="flex gap-2 text-[var(--ink-muted)]">
                <span aria-hidden="true">△</span>
                {item.risk}
              </li>
            </ul>
            <div className="min-w-24 text-right">
              <strong className="block text-3xl tabular-nums">
                {item.score}
              </strong>
              <span className="block text-xs text-[var(--ink-muted)]">
                {item.minutes.toLocaleString("en-US")} min · {item.coverage}%
                coverage
              </span>
              <span className="mt-2 inline-block">
                <ConfidenceBadge confidence={item.confidence} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
