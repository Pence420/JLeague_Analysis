export function ScoreBar({
  value,
  accent = false,
}: {
  value: number | null;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex min-w-32 items-center gap-2">
      <span className="w-7 text-right text-xs tabular-nums">
        {value ?? "—"}
      </span>
      <span className="h-2 flex-1 rounded-sm bg-[#efeeeb]">
        <span
          className="block h-full rounded-sm"
          style={{
            width: `${value ?? 0}%`,
            background: accent ? "var(--red)" : "#858784",
          }}
        />
      </span>
    </span>
  );
}
