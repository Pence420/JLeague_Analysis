"use client";

import { useMemo, useState } from "react";
import { PageFrame } from "@/components/app-shell/page-frame";
import { ScoreBar } from "@/components/ui/score-bar";
import { useLeagueDataset } from "@/features/api/use-league-dataset";

export default function TeamsPage() {
  const { dataset } = useLeagueDataset();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(dataset.teams[0].id);
  const rows = useMemo(
    () =>
      dataset.teams
        .filter((team) => team.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.points - a.points),
    [dataset, query],
  );
  const selected =
    dataset.teams.find((team) => team.id === selectedId) ?? rows[0];
  return (
    <PageFrame
      title="Teams"
      description="Compare J1 2025 club performance, playing style and data coverage."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          aria-label="Search clubs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clubs"
          className="min-w-64 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
        />
        <select className="rounded-lg border border-[var(--line)] bg-white px-4 text-sm">
          <option>All playing styles</option>
        </select>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--surface-soft)] text-xs text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th>Club</th>
                <th>Style</th>
                <th>PPM</th>
                <th>Squad signal</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team, index) => (
                <tr
                  key={team.id}
                  onClick={() => setSelectedId(team.id)}
                  className={`cursor-pointer border-t border-[var(--line)] ${team.id === selected?.id ? "bg-[#f5edef]" : "hover:bg-[var(--surface-soft)]"}`}
                >
                  <td className="px-4 py-3 text-[var(--ink-muted)]">
                    {index + 1}
                  </td>
                  <td className="font-semibold">{team.name}</td>
                  <td>
                    {team.possessionPct !== null && team.possessionPct > 52
                      ? "Possession"
                      : team.defensiveActionsPer90 !== null &&
                          team.defensiveActionsPer90 > 20
                        ? "High pressure"
                        : "Balanced"}
                  </td>
                  <td className="tabular-nums">
                    {(team.points / team.played).toFixed(2)}
                  </td>
                  <td>
                    <ScoreBar value={team.consistency} />
                  </td>
                  <td>{team.coverage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {selected && (
          <aside className="rounded-xl border border-[var(--line)] bg-white p-6">
            <p className="text-xs text-[var(--ink-muted)]">Selected club</p>
            <h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2>
            <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-[var(--line)] py-5">
              <div>
                <dt className="text-xs text-[var(--ink-muted)]">Points</dt>
                <dd className="mt-1 text-2xl">{selected.points}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--ink-muted)]">Possession</dt>
                <dd className="mt-1 text-2xl">
                  {selected.possessionPct ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--ink-muted)]">Coverage</dt>
                <dd className="mt-1 text-2xl">{selected.coverage}%</dd>
              </div>
            </dl>
            <h3 className="mt-6 font-semibold">Profile</h3>
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-sm">Attack</span>
                <ScoreBar
                  value={Math.round(
                    ((selected.expectedGoals ?? selected.goalsFor) /
                      selected.played) *
                      50,
                  )}
                  accent
                />
              </div>
              <div>
                <span className="text-sm">Control</span>
                <ScoreBar
                  value={
                    selected.possessionPct === null
                      ? null
                      : Math.round(selected.possessionPct)
                  }
                />
              </div>
              <div>
                <span className="text-sm">Disruption</span>
                <ScoreBar
                  value={
                    selected.defensiveActionsPer90 === null
                      ? null
                      : Math.min(
                          100,
                          Math.round(selected.defensiveActionsPer90 * 4),
                        )
                  }
                />
              </div>
            </div>
            <p className="mt-6 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--ink-muted)]">
              Synthetic sample profile. Use this view to choose which club
              deserves deeper tactical review.
            </p>
          </aside>
        )}
      </div>
    </PageFrame>
  );
}
