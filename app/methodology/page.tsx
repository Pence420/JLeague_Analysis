import { PageFrame } from "@/components/app-shell/page-frame";

const profiles = {
  FW: "npxG/90 25 · goals/90 20 · assists/90 15 · chances/90 15 · shots on target 10 · dribbles 10 · duels/90 5",
  MF: "chances/90 20 · assists/90 15 · opposition-half passing 15 · through passes/90 15 · dribbles 10 · duels/90 10 · interceptions/90 10 · goals−xG 5",
  DF: "duels/90 20 · aerial duels 20 · interceptions/90 15 · tackles/90 15 · tackle success 10 · clearances + blocks/90 10 · passing 10",
  GK: "save rate 35 · penalty-area save rate 20 · saves/90 15 · cross claims 10 · clean sheets 10 · distribution 10",
} as const;

const sections = [
  [
    "Source boundary",
    "Player identity, appearances, minutes and goals come from the frozen official 2025 J.LEAGUE Data Site snapshot. Advanced J STATS fields are defined but remain permission-gated; no missing value is replaced with zero.",
    "official fact ≠ J-Scout derivation",
  ],
  [
    "Position percentiles",
    "Each metric is ranked only against GK, DF, MF or FW peers. This prevents a goalkeeper score from being interpreted on a forward's statistical profile.",
    "cohort = same competition + season + position",
  ],
  [
    "Small-sample shrinkage",
    "A 450-minute outlier is pulled toward the neutral score of 50. The adjustment disappears at 1,800 minutes.",
    "50 + min(1, minutes / 1800) × (raw percentile − 50)",
  ],
  [
    "Missing data",
    "Below 60% role-profile coverage, the final proxy is withheld. Opportunity, age runway, availability and confidence may still be shown from official base records so missing advanced data does not erase useful evidence.",
    "listed 0 = valid · not listed = null · role coverage < 60% = partial only",
  ],
  [
    "Recruitment Value Proxy",
    "The final score combines role output, opportunity, development runway, availability and data confidence. It is a screening aid, not a price or scouting verdict.",
    "0.50 role + 0.20 opportunity + 0.15 development + 0.10 availability + 0.05 confidence",
  ],
] as const;

export default function MethodologyPage() {
  return (
    <PageFrame
      title="Methodology"
      description="Auditable source rules and position-aware formulas for jleague-official-2025.3."
    >
      <div className="grid gap-3 xl:grid-cols-[210px_minmax(0,1fr)_360px]">
        <aside className="surface-card p-4 xl:sticky xl:top-24 xl:self-start">
          <h2 className="font-semibold">Contents</h2>
          <nav className="mt-4 space-y-1">
            {sections.map(([title], index) => (
              <a
                key={title}
                href={`#method-${index}`}
                className="block rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--ink-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="surface-card px-6 py-2">
          {sections.map(([title, body, formula], index) => (
            <section
              id={`method-${index}`}
              key={title}
              className="border-b border-[var(--line)] py-7 last:border-0"
            >
              <p className="text-xs tabular-nums text-[var(--ink-muted)]">
                0{index + 1}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                {title}
              </h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-6 text-[var(--ink-muted)]">
                {body}
              </p>
              <code className="mt-4 block overflow-x-auto rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 font-mono text-xs leading-5">
                {formula}
              </code>
            </section>
          ))}
        </article>

        <aside className="space-y-3">
          <section className="surface-card p-5">
            <p className="eyebrow">Role profiles</p>
            <h2 className="font-semibold">What performance means</h2>
            <div className="mt-4 divide-y divide-[var(--line)]">
              {Object.entries(profiles).map(([position, metrics]) => (
                <div
                  key={position}
                  className="grid grid-cols-[34px_1fr] gap-3 py-3"
                >
                  <strong>{position}</strong>
                  <p className="text-xs leading-5 text-[var(--ink-muted)]">
                    {metrics}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-5">
            <p className="eyebrow">Worked reading</p>
            <h2 className="font-semibold">How to interpret 68.4</h2>
            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-sm">
              {[
                ["Role performance", "72.0 × 50%"],
                ["Opportunity", "64.0 × 20%"],
                ["Development", "61.0 × 15%"],
                ["Availability", "76.0 × 10%"],
                ["Data confidence", "57.0 × 5%"],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[var(--ink-muted)]">{label}</dt>
                  <dd className="text-right font-mono text-xs">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--ink-muted)]">
              Illustrative arithmetic only. The application currently withholds
              advanced official values while source status is research-only.
            </p>
          </section>

          <section className="surface-card p-5">
            <p className="eyebrow">Data register</p>
            <h2 className="font-semibold">Current source status</h2>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-2">Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Standings", "Official"],
                  ["Appearances / minutes / goals", "Official"],
                  ["J STATS advanced metrics", "Research only"],
                  ["Market values", "Unavailable"],
                ].map(([source, status]) => (
                  <tr key={source} className="border-t border-[var(--line)]">
                    <td className="py-3 pr-3">{source}</td>
                    <td className="text-xs">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </PageFrame>
  );
}
