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
      description="Inspect the complete official final table for all 20 J1 clubs."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          aria-label="Search clubs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clubs"
          className="min-w-64 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--surface-soft)] text-xs text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th>Club</th>
                <th>W-D-L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
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
                  <td className="tabular-nums">{team.wins}-{team.draws}-{team.losses}</td>
                  <td>{team.goalsFor}</td>
                  <td>{team.goalsAgainst}</td>
                  <td>{team.goalsFor - team.goalsAgainst > 0 ? "+" : ""}{team.goalsFor - team.goalsAgainst}</td>
                  <td className="font-semibold">{team.points}</td>
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
                <dt className="text-xs text-[var(--ink-muted)]">Final rank</dt>
                <dd className="mt-1 text-2xl">{selected.rank}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--ink-muted)]">Coverage</dt>
                <dd className="mt-1 text-2xl">{selected.coverage}%</dd>
              </div>
            </dl>
            <h3 className="mt-6 font-semibold">Season record</h3>
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-sm">Goals scored · {selected.goalsFor}</span>
                <ScoreBar value={Math.round(selected.goalsFor / Math.max(...dataset.teams.map((team) => team.goalsFor)) * 100)} accent />
              </div>
              <div>
                <span className="text-sm">Points · {selected.points}</span>
                <ScoreBar value={Math.round(selected.points / 76 * 100)} />
              </div>
              <div>
                <span className="text-sm">Defensive record · {selected.goalsAgainst} conceded</span>
                <ScoreBar value={Math.round((1 - selected.goalsAgainst / Math.max(...dataset.teams.map((team) => team.goalsAgainst))) * 100)} />
              </div>
            </div>
            <p className="mt-6 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--ink-muted)]">
              Official final results describe outcomes. Tactical causes still
              require event data and video review.
            </p>
          </aside>
        )}
      </div>
    </PageFrame>
  );
}
