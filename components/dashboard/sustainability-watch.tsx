import type { EvidenceItem } from "@/features/league-intelligence/types";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";

export function SustainabilityWatch({ items }: { items: EvidenceItem[] }) {
  return (
    <section className="surface-card p-5">
      <p className="eyebrow">Trend quality</p>
      <h2 className="module-title">Sustainability Watch</h2>
      <div className="mt-5 space-y-5">
        {items.slice(0, 3).map((item) => (
          <article
            key={item.id}
            className="border-t border-[var(--line)] pt-4 first:border-0 first:pt-0"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold">{item.title}</h3>
              <ConfidenceBadge confidence={item.confidence} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
              {item.interpretation}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
