import type { Confidence } from "@/features/league-intelligence/types";

const tone: Record<Confidence, string> = {
  high: "bg-[var(--ink)] text-white border-[var(--ink)]",
  medium: "bg-[var(--surface-soft)] text-[var(--ink)] border-[var(--line)]",
  low: "bg-white text-[var(--red)] border-[var(--red)]",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold capitalize ${tone[confidence]}`}
    >
      {confidence} confidence
    </span>
  );
}
