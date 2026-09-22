import { Database, Gauge, Microscope, TriangleAlert } from "lucide-react";

export function DataConfidence({ averageCoverage, missingMetricCount, snapshotDate, methodologyVersion, minimumMinutes }: { averageCoverage: number; missingMetricCount: number; snapshotDate: string; methodologyVersion: string; minimumMinutes: 450 | 900 }) {
  return (
    <section className="surface-card p-5" aria-labelledby="data-confidence-title">
      <p className="eyebrow">Evidence health</p><h2 id="data-confidence-title" className="module-title">Data Confidence</h2>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${averageCoverage}%` }} /></div>
      <p className="mt-2 text-sm"><strong>{Math.round(averageCoverage)}%</strong> average team coverage</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-[var(--ink-muted)]"><Database size={16} /> Snapshot</dt><dd>{snapshotDate}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-[var(--ink-muted)]"><TriangleAlert size={16} /> Missing metrics</dt><dd>{missingMetricCount}</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-[var(--ink-muted)]"><Gauge size={16} /> Eligibility</dt><dd>{minimumMinutes} min</dd></div>
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-[var(--ink-muted)]"><Microscope size={16} /> Method</dt><dd>{methodologyVersion}</dd></div>
      </dl>
    </section>
  );
}
