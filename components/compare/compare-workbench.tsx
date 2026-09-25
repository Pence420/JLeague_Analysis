"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageFrame } from "@/components/app-shell/page-frame";
import { useLeagueDataset } from "@/features/api/use-league-dataset";
import {
  METRIC_LABELS,
  POSITION_EVIDENCE,
  formatOfficialMetric,
} from "@/features/league-intelligence/metric-labels";

export function CompareWorkbench() {
  const { dataset } = useLeagueDataset();
  const params = useSearchParams();
  const initial = params.get("players")?.split(",") ?? [];
  const [aId, setA] = useState(initial[0] ?? dataset.players[0].id);
  const [bId, setB] = useState(initial[1] ?? dataset.players[1].id);
  const a = useMemo(
    () =>
      dataset.players.find((player) => player.id === aId) ?? dataset.players[0],
    [aId, dataset],
  );
  const b = useMemo(
    () =>
      dataset.players.find((player) => player.id === bId) ?? dataset.players[1],
    [bId, dataset],
  );
  const teams = new Map(dataset.teams.map((team) => [team.id, team.name]));
  const samePosition = a.position === b.position;
  const factualMetrics = [
    { label: "Appearances", a: a.appearances, b: b.appearances, max: 38 },
    { label: "Minutes", a: a.minutes, b: b.minutes, max: 3420 },
    {
      label: "Goals",
      a: a.goals,
      b: b.goals,
      max: Math.max(1, ...dataset.players.map((player) => player.goals)),
    },
  ];

  return (
    <PageFrame
      title="Player comparison"
      description="Compare official facts first; compare derived scores only inside the same position cohort."
    >
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <select
          aria-label="Player A"
          value={aId}
          onChange={(event) => setA(event.target.value)}
          className="rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-4 py-3 text-sm"
        >
          {dataset.players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} · {teams.get(player.teamId)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setA(bId);
            setB(aId);
          }}
          aria-label="Swap players"
          className="rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-4 transition hover:border-[#b7b3ad] active:translate-y-px"
        >
          ⇄
        </button>
        <select
          aria-label="Player B"
          value={bId}
          onChange={(event) => setB(event.target.value)}
          className="rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-4 py-3 text-sm"
        >
          {dataset.players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} · {teams.get(player.teamId)}
            </option>
          ))}
        </select>
      </div>

      {!samePosition && (
        <p
          role="status"
          className="mb-3 border-l-2 border-[var(--red)] bg-white px-4 py-3 text-sm text-[var(--ink-muted)]"
        >
          Cross-position score comparison is disabled. GK, DF, MF and FW
          percentiles use different role metrics; official bio, minutes and
          goals remain comparable below.
        </p>
      )}

      <section className="surface-card overflow-hidden">
        <div className="grid sm:grid-cols-2">
          {[a, b].map((player, index) => (
            <article
              key={`${player.id}-${index}`}
              className={`p-6 ${index === 0 ? "border-b sm:border-b-0 sm:border-r" : ""} border-[var(--line)]`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Player {index === 0 ? "A" : "B"}
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {player.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {player.nameJa} · #{player.jerseyNumber} · {player.position} ·
                age {player.age}
              </p>
              <p className="mt-4 text-sm font-semibold">
                {teams.get(player.teamId)}
              </p>
            </article>
          ))}
        </div>

        <div className="border-t border-[var(--line)] p-5 sm:p-7">
          <div className="mb-5 grid grid-cols-[1fr_100px_1fr] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <span className="text-right">{a.name}</span>
            <span className="text-center">Official fact</span>
            <span>{b.name}</span>
          </div>
          <div className="space-y-5">
            {factualMetrics.map((metric) => {
              const delta = metric.a - metric.b;
              return (
                <div
                  key={metric.label}
                  className="grid grid-cols-[1fr_100px_1fr] items-center gap-3"
                >
                  <div className="flex items-center justify-end gap-3">
                    <strong className="w-16 text-right tabular-nums">
                      {metric.a.toLocaleString("en-US")}
                    </strong>
                    <div className="flex h-2 w-full justify-end overflow-hidden rounded-l-sm bg-[var(--surface-soft)]">
                      <div
                        className="h-full bg-[var(--red)]"
                        style={{
                          width: `${Math.min(100, (metric.a / metric.max) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold">
                      {metric.label}
                    </span>
                    <span className="block text-[9px] text-[var(--ink-muted)]">
                      J.LEAGUE official
                    </span>
                    <span className="block text-[10px] tabular-nums text-[var(--ink-muted)]">
                      Δ {delta > 0 ? "+" : ""}
                      {delta.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full overflow-hidden rounded-r-sm bg-[var(--surface-soft)]">
                      <div
                        className="h-full bg-[#555755]"
                        style={{
                          width: `${Math.min(100, (metric.b / metric.max) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong className="w-16 tabular-nums">
                      {metric.b.toLocaleString("en-US")}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {samePosition && (
        <section className="surface-card mt-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Same-position evidence</p>
              <h2 className="module-title">{a.position} role metrics</h2>
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              Recruitment Value Proxy is not a transfer valuation
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs text-[var(--ink-muted)]">
                <tr>
                  <th className="pb-3">Metric</th>
                  <th>{a.name}</th>
                  <th>{b.name}</th>
                  <th>Source state</th>
                </tr>
              </thead>
              <tbody>
                {POSITION_EVIDENCE[a.position].map((key) => {
                  const aMetric = a.officialMetrics[key];
                  const bMetric = b.officialMetrics[key];
                  const display = (metric: typeof aMetric) =>
                    metric
                      ? formatOfficialMetric(
                          metric.per90 ?? metric.value,
                          metric.per90 !== null ? "per90" : metric.unit,
                        )
                      : "Not available";
                  return (
                    <tr key={key} className="border-t border-[var(--line)]">
                      <th className="py-3 font-medium">{METRIC_LABELS[key]}</th>
                      <td>{display(aMetric)}</td>
                      <td>{display(bMetric)}</td>
                      <td className="text-xs text-[var(--ink-muted)]">
                        {aMetric || bMetric
                          ? "Official metric"
                          : "Permission gated"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            {a.derivedScores.status === "scored" &&
            b.derivedScores.status === "scored"
              ? `Proxy: ${a.name} ${a.derivedScores.valueProxy?.toFixed(1)}, ${b.name} ${b.derivedScores.valueProxy?.toFixed(1)}.`
              : "Not scored — one or both players lack enough approved official role metrics."}
          </p>
        </section>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
        <section className="surface-card p-5">
          <p className="eyebrow">Physical profile</p>
          <h2 className="font-semibold">Measurements</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">
            {a.name}: {a.heightCm ?? "—"} cm / {a.weightKg ?? "—"} kg
            <br />
            {b.name}: {b.heightCm ?? "—"} cm / {b.weightKg ?? "—"} kg
          </p>
        </section>
        <section className="surface-card p-5">
          <p className="eyebrow">Evidence read</p>
          <h2 className="font-semibold">What the record says</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
            {a.minutes === b.minutes
              ? "Both logged the same league minutes."
              : `${a.minutes > b.minutes ? a.name : b.name} logged ${Math.abs(a.minutes - b.minutes).toLocaleString("en-US")} more league minutes.`}{" "}
            This is availability evidence, not proof of superior ability.
          </p>
        </section>
        <section className="surface-card p-5">
          <p className="eyebrow">Required next step</p>
          <h2 className="font-semibold">Scout before deciding</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
            Review role instructions, opposition, injuries and video. Team
            context still affects clean sheets, defensive actions and usage.
          </p>
        </section>
      </div>
    </PageFrame>
  );
}
