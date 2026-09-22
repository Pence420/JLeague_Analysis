import type { EvidenceItem } from "@/features/league-intelligence/types";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Disclosure } from "@/components/ui/disclosure";

export function PerformanceProcess({ items }: { items: EvidenceItem[] }) {
  const item = items[0];
  if (!item) return null;
  return <section className="surface-card p-5"><p className="eyebrow">Result quality</p><h2 className="module-title">Performance vs Process</h2><h3 className="mt-5 text-xl font-bold leading-tight">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{item.interpretation}</p><div className="mt-5 grid grid-cols-2 gap-2">{item.evidence.map((metric) => <div key={metric.label} className="rounded-xl bg-[var(--surface-soft)] p-3"><strong className="block text-2xl tabular-nums">{metric.value}</strong><span className="text-xs text-[var(--ink-muted)]">{metric.label}</span></div>)}</div><div className="mt-4"><ConfidenceBadge confidence={item.confidence} /></div><div className="mt-4"><Disclosure summary="Show evidence"><p className="text-sm leading-6">{item.observation}</p><p className="mt-2 text-xs text-[var(--ink-muted)]">Limitation: {item.limitation}</p></Disclosure></div></section>;
}
