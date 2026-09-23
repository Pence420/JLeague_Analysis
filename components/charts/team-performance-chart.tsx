"use client";

import { BarChart3, ChevronDown } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type {
  MetricKey,
  TeamLandscapePoint,
} from "@/features/league-intelligence/types";
import {
  metricLabels,
  TeamLandscapeFallback,
} from "./team-landscape-fallback";

const clusterLabels: Record<TeamLandscapePoint["cluster"], string> = {
  "Title race": "Top three",
  "Upper half": "Upper half",
  "Mid-table": "Mid-table",
  "Relegation zone": "Bottom three",
};

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

export function TeamPerformanceChart({
  points,
  axes,
  selectedTeamId,
  onSelectTeam,
  forceFallback = false,
  onAxisChange,
}: {
  points: TeamLandscapePoint[];
  axes: readonly [MetricKey, MetricKey, MetricKey];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  forceFallback?: boolean;
  onAxisChange?: (index: 0 | 1 | 2, value: MetricKey) => void;
}) {
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const metric = axes[0];
  const options = Object.entries(metricLabels) as Array<[MetricKey, string]>;
  const ranked = useMemo(
    () =>
      [...points].sort(
        (a, b) =>
          b.raw[metric] - a.raw[metric] ||
          a.teamName.localeCompare(b.teamName),
      ),
    [metric, points],
  );
  const values = ranked.map((point) => point.raw[metric]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const active =
    ranked.find((point) => point.teamId === hoveredTeamId) ??
    ranked.find((point) => point.teamId === selectedTeamId) ??
    ranked[0];
  const activeIndex = ranked.findIndex((point) => point.teamId === active.teamId);
  const previous = activeIndex > 0 ? ranked[activeIndex - 1] : null;
  const delta = previous ? active.raw[metric] - previous.raw[metric] : 0;

  return (
    <section
      className="surface-card min-w-0 h-full p-5"
      aria-labelledby="team-performance-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Final table, ranked by performance</p>
          <h2 id="team-performance-title" className="module-title">
            J1 2025 club performance
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Twenty clubs · hover to inspect · click to keep a club selected
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-[var(--nav)] px-3 py-1.5 text-xs font-bold text-white">
          <BarChart3 size={14} /> Ranked view
        </span>
      </div>

      {onAxisChange && (
        <label className="mt-5 flex w-full max-w-72 items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--ink-muted)]">
          Measure
          <span className="relative">
            <select
              className="appearance-none bg-transparent py-1 pr-6 text-sm font-semibold text-[var(--ink)]"
              value={metric}
              onChange={(event) =>
                onAxisChange(0, event.target.value as MetricKey)
              }
            >
              {options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
              size={14}
            />
          </span>
        </label>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="border-b border-[var(--line)] bg-white px-4 py-3" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <strong className="text-sm font-semibold">{active.teamName}</strong>
              <span className="ml-2 text-xs text-[var(--ink-muted)]">
                {clusterLabels[active.cluster]}
              </span>
            </div>
            <div className="flex items-baseline gap-2 tabular-nums">
              <strong className="text-2xl tracking-[-0.04em]">
                {active.raw[metric]}
              </strong>
              <span className="text-xs text-[var(--ink-muted)]">
                {metricLabels[metric]}
                {previous ? ` · ${signed(delta)} vs ${previous.shortName}` : " · league leader"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="max-w-full overflow-x-auto"
          role="region"
          aria-label={`${metricLabels[metric]} chart for all J1 2025 clubs`}
          tabIndex={0}
        >
          <div className="relative h-[390px] min-w-[940px] px-4 pb-12 pt-8">
            <div className="pointer-events-none absolute inset-x-4 bottom-12 top-8 flex flex-col justify-between" aria-hidden="true">
              {[maximum, ...Array.from({ length: 3 }, (_, index) => maximum - ((maximum - minimum) * (index + 1)) / 4), minimum].map((value, index) => (
                <div key={`${value}-${index}`} className="flex items-center gap-2">
                  <span className="w-7 text-right text-[9px] font-semibold tabular-nums text-[var(--ink-muted)]">
                    {Math.round(value)}
                  </span>
                  <i className="h-px flex-1 bg-[var(--line)]" />
                </div>
              ))}
            </div>

            <div className="absolute inset-x-12 bottom-12 top-8 flex items-end">
              {ranked.map((point, index) => {
                const range = Math.max(1, maximum - minimum);
                const height = 28 + ((point.raw[metric] - minimum) / range) * 70;
                const selected = point.teamId === selectedTeamId;
                const highlighted = point.teamId === active.teamId;
                const style = { "--bar-height": `${height}%` } as CSSProperties;
                return (
                  <button
                    key={point.teamId}
                    type="button"
                    className="group relative h-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 focus-visible:z-10"
                    style={style}
                    aria-label={`${point.teamName}: ${point.raw[metric]} ${metricLabels[metric]}`}
                    aria-pressed={selected}
                    onClick={() => onSelectTeam(point.teamId)}
                    onMouseEnter={() => setHoveredTeamId(point.teamId)}
                    onMouseLeave={() => setHoveredTeamId(null)}
                    onFocus={() => setHoveredTeamId(point.teamId)}
                    onBlur={() => setHoveredTeamId(null)}
                  >
                    <span
                      aria-hidden="true"
                      data-selected={selected || highlighted}
                      className="absolute inset-x-0 bottom-0 h-[var(--bar-height)] origin-bottom border-l border-white/70 bg-[repeating-linear-gradient(135deg,#bfd4f1_0,#bfd4f1_3px,#e7f0fb_3px,#e7f0fb_7px)] transition-[height,filter,transform] duration-300 ease-out [clip-path:polygon(0_0,calc(100%_-_5px)_0,100%_8px,100%_100%,0_100%)] group-hover:-translate-y-1 group-hover:brightness-[0.97] data-[selected=true]:bg-[linear-gradient(180deg,#418bea_0%,#1f6fd8_58%,#dceafb_100%)] data-[selected=true]:shadow-[0_-8px_24px_rgba(54,126,222,0.16)]"
                    />
                    <span className="absolute inset-x-0 -bottom-8 truncate px-0.5 text-center text-[9px] font-bold tracking-[-0.02em] text-[var(--ink-muted)] group-hover:text-[var(--ink)]">
                      {point.shortName}
                    </span>
                    {highlighted && (
                      <span className="absolute left-1/2 z-10 -translate-x-1/2 rounded-md bg-[var(--nav)] px-2 py-1 text-[10px] font-bold tabular-nums text-white shadow-sm bottom-[calc(var(--bar-height)+0.5rem)]">
                        {point.raw[metric]}
                      </span>
                    )}
                    {index < ranked.length - 1 && (
                      <i className="pointer-events-none absolute bottom-0 right-0 z-10 h-[var(--bar-height)] w-px bg-white/60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-[11px] font-semibold text-[var(--ink-muted)]">
        <span>Higher values appear first</span>
        <span>Official J.League 2025 totals</span>
      </div>

      <TeamLandscapeFallback
        points={ranked}
        axes={axes}
        selectedTeamId={selectedTeamId}
        onSelectTeam={onSelectTeam}
        expanded={forceFallback}
      />
    </section>
  );
}
