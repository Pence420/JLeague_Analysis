"use client";

import { useMemo, useState } from "react";
import { PageFrame } from "@/components/app-shell/page-frame";
import { ScoreBar } from "@/components/ui/score-bar";
import { useLeagueDataset } from "@/features/api/use-league-dataset";
import { weightedValueProxy } from "@/features/league-intelligence/analytics";
import {
  METRIC_LABELS,
  POSITION_EVIDENCE,
  formatOfficialMetric,
} from "@/features/league-intelligence/metric-labels";
import type {
  ComponentWeights,
  PlayerPosition,
} from "@/features/league-intelligence/types";

const COMPONENTS: Array<{ key: keyof ComponentWeights; label: string }> = [
  { key: "rolePerformance", label: "Role performance" },
  { key: "opportunity", label: "Opportunity" },
  { key: "development", label: "Age development" },
  { key: "availability", label: "Availability" },
  { key: "confidence", label: "Data confidence" },
];

const PRESETS: Record<string, ComponentWeights> = {
  Balanced: {
    rolePerformance: 50,
    opportunity: 20,
    development: 15,
    availability: 10,
    confidence: 5,
  },
  "Immediate impact": {
    rolePerformance: 65,
    opportunity: 10,
    development: 5,
    availability: 15,
    confidence: 5,
  },
  Development: {
    rolePerformance: 35,
    opportunity: 15,
    development: 35,
    availability: 10,
    confidence: 5,
  },
  "Evidence first": {
    rolePerformance: 45,
    opportunity: 10,
    development: 10,
    availability: 10,
    confidence: 25,
  },
};

function scoreStatus(status: string) {
  if (status === "scored") return "Scored";
  if (status === "ineligible")
    return "Ineligible — below the selected minutes threshold";
  return "Partial screening available — official role metrics still pending";
}

export default function MoneyballPage() {
  const { dataset } = useLeagueDataset();
  const [weights, setWeights] = useState<ComponentWeights>(PRESETS.Balanced);
  const [position, setPosition] = useState<"All" | PlayerPosition>("All");
  const [minimumMinutes, setMinimumMinutes] = useState<450 | 900>(900);
  const [selected, setSelected] = useState(dataset.players[0]?.id ?? "");
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  const ranked = useMemo(
    () =>
      dataset.players
        .filter((player) => player.minutes >= minimumMinutes)
        .filter((player) => position === "All" || player.position === position)
        .map((player) => ({
          player,
          score:
            total === 100
              ? weightedValueProxy(player.derivedScores, weights)
              : null,
        }))
        .sort(
          (a, b) =>
            (b.score ?? -1) - (a.score ?? -1) ||
            (b.player.derivedScores.confidence ?? -1) -
              (a.player.derivedScores.confidence ?? -1) ||
            b.player.minutes - a.player.minutes ||
            a.player.id.localeCompare(b.player.id),
        ),
    [dataset.players, minimumMinutes, position, total, weights],
  );

  const detail =
    ranked.find((item) => item.player.id === selected) ?? ranked[0];
  const evidenceKeys = detail ? POSITION_EVIDENCE[detail.player.position] : [];

  return (
    <PageFrame
      title="Recruitment Value Proxy"
      description="Position-aware screening with explicit inputs, sample thresholds and missing-data rules."
    >
      <section className="surface-card mb-3 p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <p className="eyebrow">Methodology {dataset.methodologyVersion}</p>
            <h2 className="text-xl font-semibold tracking-[-0.025em]">
              Set the recruitment lens
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
              Presets prepare the five canonical weights and become active for
              the final proxy once role metrics are available. Position metrics
              and percentile logic stay fixed in the backend.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([name, values]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setWeights(values)}
                  className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm transition active:translate-y-px ${JSON.stringify(weights) === JSON.stringify(values) ? "border-[var(--ink)] bg-[var(--ink)] text-white!" : "border-[var(--line)] bg-white hover:border-[#b7b3ad]"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-medium text-[var(--ink-muted)]">
              Position
              <select
                aria-label="Recruitment position"
                value={position}
                onChange={(event) =>
                  setPosition(event.target.value as "All" | PlayerPosition)
                }
                className="mt-1 block rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option>All</option>
                {(["GK", "DF", "MF", "FW"] as const).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-[var(--ink-muted)]">
              Minimum minutes
              <select
                aria-label="Minimum minutes"
                value={minimumMinutes}
                onChange={(event) =>
                  setMinimumMinutes(Number(event.target.value) as 450 | 900)
                }
                className="mt-1 block rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option value={900}>900 · standard</option>
                <option value={450}>450 · discovery</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-5">
          {COMPONENTS.map(({ key, label }) => (
            <label
              key={key}
              className="text-xs font-medium text-[var(--ink-muted)]"
            >
              {label}
              <input
                aria-label={`${label} weight`}
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(event) =>
                  setWeights((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3 py-2 text-sm tabular-nums text-[var(--ink)]"
              />
            </label>
          ))}
        </div>
        {total !== 100 && (
          <p
            role="alert"
            className="mt-3 text-sm font-medium text-[var(--red)]"
          >
            Weights total {total}%. Set them to exactly 100% to rank players.
          </p>
        )}
        {minimumMinutes === 450 && (
          <p className="mt-3 border-l-2 border-[var(--red)] pl-3 text-sm text-[var(--ink-muted)]">
            Discovery mode includes smaller samples. Percentiles are pulled
            toward 50 until a player reaches 1,800 minutes.
          </p>
        )}
        <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--ink-muted)] sm:grid-cols-[auto_1fr]">
          <strong className="font-semibold text-[var(--ink)]">
            Base-data components available
          </strong>
          <p>
            Opportunity, age development, availability and confidence use
            official minutes, appearances, age and coverage. Role performance
            and the final proxy remain unavailable until approved J.STATS
            evidence is imported.
          </p>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section
          className="surface-card overflow-x-auto"
          aria-label="Recruitment ranking"
        >
          <table className="w-full min-w-[1060px] text-left text-sm [&_td]:px-3 [&_th]:whitespace-nowrap [&_th]:px-3">
            <thead className="bg-[var(--surface-soft)] text-xs text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th>Player</th>
                <th>Pos</th>
                <th>Minutes</th>
                <th>Role performance</th>
                <th>Opportunity</th>
                <th title="Age runway only until role metrics become available">
                  Age development
                </th>
                <th>Availability</th>
                <th>Confidence</th>
                <th>Proxy</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 30).map(({ player, score }, index) => (
                <tr
                  key={player.id}
                  onClick={() => setSelected(player.id)}
                  className={`cursor-pointer border-t border-[var(--line)] transition hover:bg-[var(--surface-soft)] ${player.id === detail?.player.id ? "bg-[#f3f1ed]" : ""}`}
                >
                  <td className="px-4 py-3 tabular-nums">{index + 1}</td>
                  <td>
                    <strong className="block font-semibold">
                      {player.name}
                    </strong>
                    <span className="text-xs text-[var(--ink-muted)]">
                      {player.role}
                    </span>
                  </td>
                  <td>{player.position}</td>
                  <td className="tabular-nums">
                    {player.minutes.toLocaleString("en-US")}
                  </td>
                  <td>
                    <ScoreBar
                      value={player.derivedScores.rolePerformance}
                      accent
                    />
                  </td>
                  <td>
                    <ScoreBar value={player.derivedScores.opportunity} />
                  </td>
                  <td>
                    <ScoreBar value={player.derivedScores.development} />
                  </td>
                  <td>
                    <ScoreBar value={player.derivedScores.availability} />
                  </td>
                  <td>
                    <ScoreBar value={player.derivedScores.confidence} />
                  </td>
                  <td className="font-semibold tabular-nums">
                    {score?.toFixed(1) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {detail && (
          <aside className="surface-card p-6 xl:sticky xl:top-24 xl:self-start">
            <p className="eyebrow">Selected player</p>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">
              {detail.player.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {detail.player.position} · {detail.player.role} · age{" "}
              {detail.player.age}
            </p>
            <div className="my-6 border-y border-[var(--line)] py-5">
              <span className="text-xs text-[var(--ink-muted)]">
                Recruitment Value Proxy
              </span>
              <strong className="mt-1 block text-5xl font-medium tabular-nums">
                {detail.score?.toFixed(1) ?? "—"}
              </strong>
              <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">
                {scoreStatus(detail.player.derivedScores.status)}
              </p>
            </div>

            <h3 className="font-semibold">Base-data profile</h3>
            <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--line)] text-sm">
              {(
                [
                  ["Opportunity", detail.player.derivedScores.opportunity],
                  ["Age development", detail.player.derivedScores.development],
                  ["Availability", detail.player.derivedScores.availability],
                  ["Confidence", detail.player.derivedScores.confidence],
                ] satisfies Array<[string, number | null]>
              ).map(([label, value]) => (
                <div key={label} className="bg-white p-3">
                  <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">
                    {typeof value === "number" ? value.toFixed(1) : "—"}
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-6 font-semibold">Position evidence</h3>
            <dl className="mt-3 divide-y divide-[var(--line)] text-sm">
              {evidenceKeys.map((key) => {
                const metric = detail.player.officialMetrics[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="text-[var(--ink-muted)]">
                      {METRIC_LABELS[key]}
                    </dt>
                    <dd className="text-right font-medium tabular-nums">
                      {metric
                        ? formatOfficialMetric(
                            metric.per90 ?? metric.value,
                            metric.per90 !== null ? "per90" : metric.unit,
                          )
                        : "Not available"}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <div className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--ink-muted)]">
              <p>
                Data confidence:{" "}
                {detail.player.derivedScores.confidence === null
                  ? "pending"
                  : `${detail.player.derivedScores.confidence}%`}
                .
              </p>
              <p className="mt-2">
                This proxy is not a transfer valuation or a scouting verdict.
                Video, role context and medical review remain required.
              </p>
            </div>
          </aside>
        )}
      </div>
    </PageFrame>
  );
}
