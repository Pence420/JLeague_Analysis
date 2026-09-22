"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageFrame } from "@/components/app-shell/page-frame";
import { ScoreBar } from "@/components/ui/score-bar";
import { useLeagueDataset } from "@/features/api/use-league-dataset";

const metrics = [
  "performance",
  "potential",
  "opportunity",
  "availability",
] as const;

export function CompareWorkbench() {
  const { dataset } = useLeagueDataset();
  const params = useSearchParams();
  const initial = params.get("players")?.split(",") ?? [];
  const [aId, setA] = useState(initial[0] ?? dataset.players[0].id);
  const [bId, setB] = useState(initial[1] ?? dataset.players[1].id);
  const a = useMemo(
    () => dataset.players.find((player) => player.id === aId)!,
    [aId, dataset],
  );
  const b = useMemo(
    () => dataset.players.find((player) => player.id === bId)!,
    [bId, dataset],
  );
  const points = (player: typeof a) =>
    metrics
      .map((metric, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI) / 2;
        const radius = (player[metric] ?? 0) * 1.1;
        return `${120 + Math.cos(angle) * radius},${120 + Math.sin(angle) * radius}`;
      })
      .join(" ");

  return (
    <PageFrame
      title="Player comparison"
      description="Compare shared percentiles, role fit and evidence limitations."
    >
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <select
          aria-label="Player A"
          value={aId}
          onChange={(event) => setA(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white px-4 py-3"
        >
          {dataset.players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setA(bId);
            setB(aId);
          }}
          aria-label="Swap players"
          className="rounded-lg border border-[var(--line)] bg-white px-4"
        >
          ⇄
        </button>
        <select
          aria-label="Player B"
          value={bId}
          onChange={(event) => setB(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white px-4 py-3"
        >
          {dataset.players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>
      <section className="mb-3 grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-[var(--line)] bg-white p-5">
          <span className="text-xs text-[var(--red)]">Player A</span>
          <h2 className="mt-1 text-xl font-semibold">{a.name}</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            {a.role} · {a.position} · {a.age} years
          </p>
        </article>
        <article className="rounded-xl border border-[var(--line)] bg-white p-5">
          <span className="text-xs text-[var(--ink-muted)]">Player B</span>
          <h2 className="mt-1 text-xl font-semibold">{b.name}</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            {b.role} · {b.position} · {b.age} years
          </p>
        </article>
      </section>
      <div className="grid gap-3 lg:grid-cols-[420px_1fr]">
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Shared metric shape</h2>
          <svg
            viewBox="0 0 240 240"
            className="mx-auto mt-3 max-w-[330px]"
            aria-label="Comparison radar"
          >
            <polygon
              points="120,10 230,120 120,230 10,120"
              fill="#f6f5f2"
              stroke="#d9d7d2"
            />
            <polygon
              points={points(a)}
              fill="rgba(127,23,52,.08)"
              stroke="#7f1734"
              strokeWidth="2"
            />
            <polygon
              points={points(b)}
              fill="none"
              stroke="#555755"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          </svg>
          <div className="flex justify-center gap-5 text-xs">
            <span className="text-[var(--red)]">— Player A</span>
            <span>-- Player B</span>
          </div>
        </section>
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Shared metrics</h2>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {metrics.map((metric) => (
              <div
                key={metric}
                className="grid items-center gap-3 py-4 sm:grid-cols-[160px_1fr_1fr]"
              >
                <span className="capitalize">{metric}</span>
                <ScoreBar value={a[metric]} accent />
                <ScoreBar value={b[metric]} />
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Biographical differences</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Age</dt>
              <dd>
                {a.age} / {b.age}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Minutes</dt>
              <dd>
                {a.minutes.toLocaleString("en-US")} /{" "}
                {b.minutes.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Position</dt>
              <dd>
                {a.position} / {b.position}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Role fit</h2>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
            {a.name} projects as {a.role.toLowerCase()}; {b.name} projects as{" "}
            {b.role.toLowerCase()}. Use shared metrics cautiously when position
            groups differ.
          </p>
        </section>
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Evidence summary</h2>
          <p className="mt-4 text-sm leading-6">
            {(a.performance ?? 0) > (b.performance ?? 0) ? a.name : b.name} has
            the stronger current performance signal. This does not account for
            opponent strength, tactical instructions, injuries or video context.
          </p>
        </section>
      </div>
    </PageFrame>
  );
}
