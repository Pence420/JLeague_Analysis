import { CalendarDays, Database, SlidersHorizontal } from "lucide-react";

export function ContextHeader({ snapshotDate, methodologyVersion, minimumMinutes, onMinimumMinutesChange }: { snapshotDate: string; methodologyVersion: string; minimumMinutes: 450 | 900; onMinimumMinutesChange: (value: 450 | 900) => void }) {
  return (
    <section className="grid gap-6 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[var(--red)]"><span className="h-px w-8 bg-[var(--red)]" /> RECRUITMENT INTELLIGENCE</div>
        <h1 className="max-w-4xl text-[clamp(2.6rem,5vw,5.4rem)] font-black leading-[0.9] tracking-[-0.065em]"><span className="text-[var(--red)]">J1</span> League Intelligence</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">See the league as a recruitment system: what drives results, which styles stand apart, and where evidence points analysts next.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:w-[410px]">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3"><CalendarDays size={18} /><span><small className="block text-[10px] font-bold uppercase text-[var(--ink-muted)]">Snapshot</small>{snapshotDate}</span></div>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3"><SlidersHorizontal size={18} /><span className="grow"><small className="block text-[10px] font-bold uppercase text-[var(--ink-muted)]">Minimum minutes</small><select aria-label="Minimum minutes" value={minimumMinutes} onChange={(event) => onMinimumMinutesChange(Number(event.target.value) as 450 | 900)} className="w-full bg-transparent font-semibold outline-none"><option value={900}>900 minutes</option><option value={450}>450 minutes</option></select></span></label>
        <div className="col-span-full flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"><span className="flex items-center gap-2 font-bold text-emerald-800"><Database size={17} /> Synthetic sample data</span><span className="text-xs text-emerald-700">Methodology {methodologyVersion}</span></div>
        {minimumMinutes === 450 && <p className="col-span-full text-xs font-semibold text-amber-800">Low-sample mode is active. Treat rankings as discovery signals only.</p>}
      </div>
    </section>
  );
}
