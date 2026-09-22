"use client";

import type {
  MetricKey,
  TeamLandscapePoint,
} from "@/features/league-intelligence/types";

export const metricLabels: Record<MetricKey, string> = {
  attackingOutput: "Attacking output",
  possessionControl: "Possession control",
  defensiveDisruption: "Defensive disruption",
};

export function TeamLandscapeFallback({
  points,
  axes,
  selectedTeamId,
  onSelectTeam,
  expanded = false,
}: {
  points: TeamLandscapePoint[];
  axes: readonly [MetricKey, MetricKey, MetricKey];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  expanded?: boolean;
}) {
  const selected = points.find((point) => point.teamId === selectedTeamId);
  return (
    <details
      className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]"
      open={expanded}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold">
        Accessible team-style data
      </summary>
      <div className="border-t border-[var(--line)] p-4">
        <p className="max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
          This view compares {metricLabels[axes[0]]}, {metricLabels[axes[1]]},
          and {metricLabels[axes[2]]}.{" "}
          {selected
            ? `${selected.teamName} is classified as ${selected.cluster.toLowerCase()}.`
            : "Choose a team to inspect its profile."}
        </p>
        <div
          className="mt-4 overflow-x-auto"
          role="region"
          aria-label="Team style data"
          tabIndex={0}
        >
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--ink-muted)]">
                <th className="pb-2">Team</th>
                {axes.map((axis) => (
                  <th className="pb-2 text-right" key={axis}>
                    {metricLabels[axis]}
                  </th>
                ))}
                <th className="pb-2">Cluster</th>
                <th className="pb-2 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr
                  key={point.teamId}
                  className={`border-t border-[var(--line)] ${selectedTeamId === point.teamId ? "bg-red-50" : ""}`}
                >
                  <td className="py-3">
                    <button
                      className="font-bold hover:text-[var(--red)]"
                      onClick={() => onSelectTeam(point.teamId)}
                    >
                      {point.teamName}
                    </button>
                  </td>
                  {axes.map((axis) => (
                    <td className="py-3 text-right tabular-nums" key={axis}>
                      {point.raw[axis].toFixed(
                        axis === "possessionControl" ? 1 : 2,
                      )}
                    </td>
                  ))}
                  <td className="py-3">{point.cluster}</td>
                  <td className="py-3 text-right">{point.coverage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
