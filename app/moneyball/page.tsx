"use client";

import { useMemo, useState } from "react";
import { PageFrame } from "@/components/app-shell/page-frame";
import { ScoreBar } from "@/components/ui/score-bar";
import { useLeagueDataset } from "@/features/api/use-league-dataset";

const presets = {
  Balanced: [45, 25, 20, 10],
  "Immediate impact": [60, 10, 10, 20],
  Development: [30, 45, 15, 10],
  Opportunity: [30, 20, 40, 10],
} as const;
export default function MoneyballPage() {
  const { dataset } = useLeagueDataset();
  const [weights, setWeights] = useState<number[]>([45, 25, 20, 10]);
  const [selected, setSelected] = useState(dataset.players[0].id);
  const total = weights.reduce((sum, value) => sum + value, 0);
  const ranked = useMemo(
    () =>
      dataset.players
        .filter((player) => player.minutes >= 900 && player.coverage >= 60)
        .map((player) => ({
          player,
          score:
            total === 100
              ? Math.round(
                  ((player.performance ?? 0) * weights[0] +
                    (player.potential ?? 0) * weights[1] +
                    (player.opportunity ?? 0) * weights[2] +
                    (player.availability ?? 0) * weights[3]) /
                    100,
                )
              : 0,
        }))
        .sort((a, b) => b.score - a.score),
    [dataset, weights, total],
  );
  const detail =
    ranked.find((item) => item.player.id === selected) ?? ranked[0];
  return (
    <PageFrame
      title="Moneyball shortlist"
      description="Re-rank eligible players with transparent, role-aware weighting."
    >
      <section className="mb-3 rounded-xl border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <span className="mb-2 block text-xs text-[var(--ink-muted)]">
              Weight preset
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(presets).map(([name, values]) => (
                <button
                  key={name}
                  onClick={() => setWeights([...values])}
                  className={`rounded-lg border px-3 py-2 text-sm ${weights.join() === values.join() ? "border-[var(--red)] bg-[#f5edef] text-[var(--red)]" : "border-[var(--line)]"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto grid grid-cols-4 gap-2">
            {["Performance", "Potential", "Opportunity", "Availability"].map(
              (label, index) => (
                <label key={label} className="text-xs text-[var(--ink-muted)]">
                  {label}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={weights[index]}
                    onChange={(event) =>
                      setWeights((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index
                            ? Number(event.target.value)
                            : value,
                        ),
                      )
                    }
                    className="mt-1 block w-20 rounded-lg border border-[var(--line)] px-3 py-2 text-[var(--ink)]"
                  />
                </label>
              ),
            )}
          </div>
        </div>
        {total !== 100 && (
          <p className="mt-3 text-sm text-[var(--red)]">
            Weights total {total}%. Set them to exactly 100% to rank players.
          </p>
        )}
      </section>
      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <section className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--surface-soft)] text-xs text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th>Player</th>
                <th>Role</th>
                <th>Performance</th>
                <th>Potential</th>
                <th>Opportunity</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 15).map(({ player, score }, index) => (
                <tr
                  key={player.id}
                  onClick={() => setSelected(player.id)}
                  className={`cursor-pointer border-t border-[var(--line)] ${player.id === detail?.player.id ? "bg-[#f5edef]" : ""}`}
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="font-semibold">{player.name}</td>
                  <td>{player.role}</td>
                  <td>
                    <ScoreBar value={player.performance} />
                  </td>
                  <td>
                    <ScoreBar value={player.potential} />
                  </td>
                  <td>
                    <ScoreBar value={player.opportunity} />
                  </td>
                  <td className="font-semibold tabular-nums">
                    {total === 100 ? score : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {detail && (
          <aside className="rounded-xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-xl font-semibold">{detail.player.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {detail.player.role} · {detail.player.position} · age{" "}
              {detail.player.age}
            </p>
            <div className="my-6 border-y border-[var(--line)] py-5">
              <span className="text-xs text-[var(--ink-muted)]">
                Moneyball score
              </span>
              <strong className="mt-1 block text-5xl font-medium">
                {total === 100 ? detail.score : "—"}
              </strong>
            </div>
            <h3 className="font-semibold">Score decomposition</h3>
            <div className="mt-4 space-y-4">
              {[
                ["Performance", detail.player.performance],
                ["Potential", detail.player.potential],
                ["Opportunity", detail.player.opportunity],
                ["Availability", detail.player.availability],
              ].map(([label, value], index) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{weights[index]}%</span>
                  </div>
                  <ScoreBar
                    value={value as number | null}
                    accent={index === 0}
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-[var(--ink-muted)]">
              Opportunity replaces financial value because no licensed
              market-value source is connected.
            </p>
          </aside>
        )}
      </div>
    </PageFrame>
  );
}
