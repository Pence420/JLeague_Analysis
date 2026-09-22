import { formatMetric } from "@/features/league-intelligence/analytics";

export function MetricValue({ value, format, label }: { value: number | null; format: "integer" | "decimal" | "percent"; label: string }) {
  return (
    <span className="tabular-nums" aria-label={`${label}: ${formatMetric(value, format)}`}>
      {formatMetric(value, format)}
    </span>
  );
}
