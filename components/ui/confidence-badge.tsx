import type { Confidence } from "@/features/league-intelligence/types";

const tone: Record<Confidence, string> = {
  high: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-rose-50 text-rose-800 border-rose-200",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${tone[confidence]}`}>{confidence} confidence</span>;
}
