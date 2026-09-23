"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageFrame } from "@/components/app-shell/page-frame";
import { useLeagueDataset } from "@/features/api/use-league-dataset";

export function CompareWorkbench() {
  const { dataset } = useLeagueDataset();
  const params = useSearchParams();
  const initial = params.get("players")?.split(",") ?? [];
  const [aId, setA] = useState(initial[0] ?? dataset.players[0].id);
  const [bId, setB] = useState(initial[1] ?? dataset.players[1].id);
  const a = useMemo(() => dataset.players.find((player) => player.id === aId) ?? dataset.players[0], [aId, dataset]);
  const b = useMemo(() => dataset.players.find((player) => player.id === bId) ?? dataset.players[1], [bId, dataset]);
  const teams = new Map(dataset.teams.map((team) => [team.id, team.name]));
  const metrics = [
    { label: "Appearances", a: a.appearances, b: b.appearances, max: 38, official: true },
    { label: "Minutes", a: a.minutes, b: b.minutes, max: 3420, official: true },
    { label: "Goals", a: a.goals, b: b.goals, max: Math.max(1, ...dataset.players.map((player) => player.goals)), official: true },
    { label: "Availability", a: a.availability ?? 0, b: b.availability ?? 0, max: 100, official: false },
    { label: "Involvement", a: a.performance ?? 0, b: b.performance ?? 0, max: 100, official: false },
  ];

  return (
    <PageFrame title="Player comparison" description="A factual side-by-side view with mirrored bars, deltas and explicit derived metrics.">
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <select aria-label="Player A" value={aId} onChange={(event) => setA(event.target.value)} className="rounded-lg border border-[var(--line)] bg-white px-4 py-3">
          {dataset.players.map((player) => <option key={player.id} value={player.id}>{player.name} · {teams.get(player.teamId)}</option>)}
        </select>
        <button onClick={() => { setA(bId); setB(aId); }} aria-label="Swap players" className="rounded-lg border border-[var(--line)] bg-white px-4">⇄</button>
        <select aria-label="Player B" value={bId} onChange={(event) => setB(event.target.value)} className="rounded-lg border border-[var(--line)] bg-white px-4 py-3">
          {dataset.players.map((player) => <option key={player.id} value={player.id}>{player.name} · {teams.get(player.teamId)}</option>)}
        </select>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <div className="grid sm:grid-cols-2">
          {[a, b].map((player, index) => (
            <article key={`${player.id}-${index}`} className={`p-6 ${index === 0 ? "border-b sm:border-b-0 sm:border-r" : ""} border-[var(--line)]`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">Player {index === 0 ? "A" : "B"}</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{player.name}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{player.nameJa} · #{player.jerseyNumber} · {player.position} · age {player.age}</p>
              <p className="mt-4 text-sm font-semibold">{teams.get(player.teamId)}</p>
            </article>
          ))}
        </div>

        <div className="border-t border-[var(--line)] p-5 sm:p-7">
          <div className="mb-5 grid grid-cols-[1fr_100px_1fr] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <span className="text-right">{a.name}</span><span className="text-center">Metric</span><span>{b.name}</span>
          </div>
          <div className="space-y-5">
            {metrics.map((metric) => {
              const delta = metric.a - metric.b;
              return (
                <div key={metric.label} className="grid grid-cols-[1fr_100px_1fr] items-center gap-3">
                  <div className="flex items-center justify-end gap-3">
                    <strong className="w-16 text-right tabular-nums">{metric.a.toLocaleString("en-US")}</strong>
                    <div className="flex h-3 w-full justify-end overflow-hidden rounded-l-full bg-[var(--surface-soft)]">
                      <div className="h-full bg-[var(--red)]" style={{ width: `${Math.min(100, metric.a / metric.max * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold">{metric.label}</span>
                    <span className="mt-0.5 block text-[9px] text-[var(--ink-muted)]">{metric.official ? "official" : "J-Scout derived"}</span>
                    <span className="block text-[10px] tabular-nums text-[var(--ink-muted)]">Δ {delta > 0 ? "+" : ""}{delta.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-full overflow-hidden rounded-r-full bg-[var(--surface-soft)]">
                      <div className="h-full bg-[#555755]" style={{ width: `${Math.min(100, metric.b / metric.max * 100)}%` }} />
                    </div>
                    <strong className="w-16 tabular-nums">{metric.b.toLocaleString("en-US")}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <p className="eyebrow">Physical profile</p><h2 className="font-semibold">Measurements</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">{a.name}: {a.heightCm ?? "—"} cm / {a.weightKg ?? "—"} kg<br />{b.name}: {b.heightCm ?? "—"} cm / {b.weightKg ?? "—"} kg</p>
        </section>
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <p className="eyebrow">Evidence read</p><h2 className="font-semibold">What the record says</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">{a.minutes === b.minutes ? "Both logged the same league minutes." : `${a.minutes > b.minutes ? a.name : b.name} logged ${Math.abs(a.minutes - b.minutes).toLocaleString("en-US")} more league minutes.`} This is availability evidence, not proof of superior ability.</p>
        </section>
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <p className="eyebrow">Required next step</p><h2 className="font-semibold">Scout before deciding</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">Compare role, opposition, injuries and video. The official record here does not contain assists, xG, duel data or tactical instructions.</p>
        </section>
      </div>
    </PageFrame>
  );
}
