import { PageFrame } from "@/components/app-shell/page-frame";

const sections = [
  [
    "Per-90 normalization",
    "Counting statistics are divided by minutes and multiplied by 90. Percentages, ages and already-normalized rates are not converted.",
    "metric_per90 = raw_metric / minutes × 90",
  ],
  [
    "Position percentiles",
    "Players are ranked only against the same competition, season and comparison group. Lower-is-better metrics are inverted before display.",
    "percentile ∈ [0, 100]",
  ],
  [
    "Reliability adjustment",
    "Small samples regress toward the position mean. The configured k is 900 minutes for this sample methodology.",
    "adjusted = r × player + (1 − r) × group_mean",
  ],
  [
    "Moneyball score",
    "A transparent composite of performance, potential, opportunity and availability. Players below 60% coverage are not ranked.",
    "0.45P + 0.25Pot + 0.20Opp + 0.10Avail",
  ],
  [
    "European fit",
    "The MVP uses profile similarity and readiness, not a claimed career-outcome prediction.",
    "fit = weighted profile similarity",
  ],
  [
    "Known limitations",
    "All current records are synthetic. No licensed event coordinates, market values, medical data or human scouting reports are connected.",
    "analytics shortlist; humans decide",
  ],
] as const;
export default function MethodologyPage() {
  return (
    <PageFrame
      title="Methodology"
      description="Transparent calculations, coverage and limitations for sample-0.1.0."
    >
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_360px]">
        <aside className="rounded-xl border border-[var(--line)] bg-white p-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-semibold">Contents</h2>
          <nav className="mt-4 space-y-1">
            {sections.map(([title], index) => (
              <a
                key={title}
                href={`#method-${index}`}
                className="block rounded-lg px-3 py-2 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="rounded-xl border border-[var(--line)] bg-white px-6 py-2">
          {sections.map(([title, body, formula], index) => (
            <section
              id={`method-${index}`}
              key={title}
              className="border-b border-[var(--line)] py-7 last:border-0"
            >
              <p className="text-xs text-[var(--ink-muted)]">{index + 1}.</p>
              <h2 className="mt-1 text-xl font-semibold">{title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
                {body}
              </p>
              <code className="mt-4 block rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 font-mono text-sm">
                {formula}
              </code>
            </section>
          ))}
        </article>
        <aside className="space-y-3">
          <section className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-semibold">Data coverage</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-2">Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--line)]">
                  <td className="py-3">Synthetic fixture</td>
                  <td>Enabled</td>
                </tr>
                <tr className="border-t border-[var(--line)]">
                  <td className="py-3">Licensed J1 data</td>
                  <td>Not connected</td>
                </tr>
                <tr className="border-t border-[var(--line)]">
                  <td className="py-3">Event coordinates</td>
                  <td>Disabled</td>
                </tr>
                <tr className="border-t border-[var(--line)]">
                  <td className="py-3">Market values</td>
                  <td>Unavailable</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-semibold">Version history</h2>
            <div className="mt-4 border-l-2 border-[var(--red)] pl-4">
              <strong className="text-sm">sample-0.1.0</strong>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
                Initial typed fixture, reliability-aware ranking and profile-fit
                assumptions.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </PageFrame>
  );
}
