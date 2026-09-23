import { PageFrame } from "@/components/app-shell/page-frame";

const sections = [
  ["Official facts", "Final standings, appearances, minutes and goals come from J.LEAGUE Data Site pages frozen at the end of the 2025 season.", "official record → immutable snapshot"],
  ["Availability", "A simple minutes share. It indicates league availability, not quality or injury status.", "availability = min(100, minutes / 3420 × 100)"],
  ["Involvement", "A J-Scout derived discovery score combining minutes share, appearance share and a capped goal signal.", "0.50 minutes + 0.25 appearances + 0.25 goals"],
  ["Potential proxy", "An age-only discovery proxy. It must never be read as a forecast of development or transfer success.", "potential = clamp(100 − (age − 18) × 4)"],
  ["Moneyball score", "A user-weighted composite of explicitly derived scores. Players below the chosen minutes threshold are excluded.", "0.45 involvement + 0.25 age proxy + 0.20 opportunity + 0.10 availability"],
  ["Known limitations", "No event coordinates, xG, assists, duel data, medical history, salary or market valuation are present. Video and human scouting remain required.", "analytics shortlist; humans decide"],
] as const;

export default function MethodologyPage() {
  return (
    <PageFrame title="Methodology" description="Official source boundaries and transparent formulas for jleague-official-2025.1.">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_360px]">
        <aside className="rounded-xl border border-[var(--line)] bg-white p-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-semibold">Contents</h2>
          <nav className="mt-4 space-y-1">{sections.map(([title], index) => <a key={title} href={`#method-${index}`} className="block rounded-lg px-3 py-2 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]">{title}</a>)}</nav>
        </aside>
        <article className="rounded-xl border border-[var(--line)] bg-white px-6 py-2">
          {sections.map(([title, body, formula], index) => (
            <section id={`method-${index}`} key={title} className="border-b border-[var(--line)] py-7 last:border-0">
              <p className="text-xs text-[var(--ink-muted)]">{index + 1}.</p><h2 className="mt-1 text-xl font-semibold">{title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">{body}</p>
              <code className="mt-4 block rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 font-mono text-sm">{formula}</code>
            </section>
          ))}
        </article>
        <aside className="space-y-3">
          <section className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-semibold">Data coverage</h2>
            <table className="mt-4 w-full text-left text-sm"><thead className="text-xs text-[var(--ink-muted)]"><tr><th className="pb-2">Source</th><th>Status</th></tr></thead><tbody>
              {[ ["J1 final standings", "Official"], ["Player records", "Official"], ["Event / xG", "Unavailable"], ["Market values", "Unavailable"] ].map(([source, status]) => <tr key={source} className="border-t border-[var(--line)]"><td className="py-3">{source}</td><td>{status}</td></tr>)}
            </tbody></table>
          </section>
          <section className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-semibold">Version history</h2><div className="mt-4 border-l-2 border-[var(--red)] pl-4"><strong className="text-sm">jleague-official-2025.1</strong><p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">Final 2025 snapshot: 20 clubs and 772 unique club-season player records.</p></div>
          </section>
        </aside>
      </div>
    </PageFrame>
  );
}
