import { CalendarDays, Database, SlidersHorizontal } from "lucide-react";

export function ContextHeader({
  snapshotDate,
  methodologyVersion,
  minimumMinutes,
  onMinimumMinutesChange,
  dataSource = "local",
}: {
  snapshotDate: string;
  methodologyVersion: string;
  minimumMinutes: 450 | 900;
  onMinimumMinutesChange: (value: 450 | 900) => void;
  dataSource?: "api" | "local";
}) {
  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          League overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
          J1 2025 performance, playing style and recruitment signals.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:w-[410px]">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
          <CalendarDays size={18} />
          <span>
            <small className="block text-[10px] font-bold uppercase text-[var(--ink-muted)]">
              Snapshot
            </small>
            {snapshotDate}
          </span>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
          <SlidersHorizontal size={18} />
          <span className="grow">
            <small className="block text-[10px] font-bold uppercase text-[var(--ink-muted)]">
              Minimum minutes
            </small>
            <select
              aria-label="Minimum minutes"
              value={minimumMinutes}
              onChange={(event) =>
                onMinimumMinutesChange(Number(event.target.value) as 450 | 900)
              }
              className="w-full bg-transparent font-semibold outline-none"
            >
              <option value={900}>900 minutes</option>
              <option value={450}>450 minutes</option>
            </select>
          </span>
        </label>
        <div className="col-span-full flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <Database size={16} /> Synthetic sample ·{" "}
            {dataSource === "api" ? "API connected" : "local fallback"}
          </span>
          <span className="text-xs text-[var(--ink-muted)]">
            Methodology {methodologyVersion}
          </span>
        </div>
        {minimumMinutes === 450 && (
          <p className="col-span-full text-xs font-semibold text-amber-800">
            Low-sample mode is active. Treat rankings as discovery signals only.
          </p>
        )}
      </div>
    </section>
  );
}
