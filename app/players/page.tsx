"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageFrame } from "@/components/app-shell/page-frame";
import { useLeagueDataset } from "@/features/api/use-league-dataset";
import {
  METRIC_LABELS,
  POSITION_EVIDENCE,
  formatOfficialMetric,
} from "@/features/league-intelligence/metric-labels";

export default function PlayersPage() {
  const { dataset } = useLeagueDataset();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const players = useMemo(() => {
    return dataset.players
      .filter(
        (player) =>
          (position === "All" || player.position === position) &&
          `${player.name} ${player.nameJa}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .sort(
        (a, b) =>
          (b.derivedScores.valueProxy ?? -1) -
            (a.derivedScores.valueProxy ?? -1) ||
          b.minutes - a.minutes ||
          a.id.localeCompare(b.id),
      );
  }, [dataset, query, position]);
  const toggle = (id: string) =>
    setShortlist((items) =>
      items.includes(id)
        ? items.filter((item) => item !== id)
        : items.length < 5
          ? [...items, id]
          : items,
    );
  return (
    <PageFrame
      title="Player explorer"
      description="Browse official 2025 records, position evidence and transparent score availability."
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          aria-label="Search players"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search player"
          className="min-w-64 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm"
        />
        <select
          aria-label="Position"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white px-4 text-sm"
        >
          <option>All</option>
          {["GK", "DF", "MF", "FW"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <Link
          href={`/compare?players=${shortlist.slice(0, 2).join(",")}`}
          aria-disabled={shortlist.length < 2}
          className={`ml-auto rounded-lg px-4 py-2.5 text-sm ${shortlist.length >= 2 ? "bg-[var(--nav)] text-white" : "bg-[var(--surface-soft)] text-[var(--ink-muted)]"}`}
        >
          Compare ({shortlist.length})
        </Link>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <section className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[var(--surface-soft)] text-xs text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-3">Select</th>
                <th>Player</th>
                <th>Club</th>
                <th>Pos</th>
                <th>Age</th>
                <th>Apps</th>
                <th>Minutes</th>
                <th>Goals</th>
                <th>Official role evidence</th>
                <th>Recruitment proxy</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.id}
                  className="border-t border-[var(--line)] hover:bg-[var(--surface-soft)]"
                >
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Select ${player.name}`}
                      type="checkbox"
                      checked={shortlist.includes(player.id)}
                      onChange={() => toggle(player.id)}
                    />
                  </td>
                  <td className="font-semibold">{player.name}</td>
                  <td>
                    {
                      dataset.teams.find((team) => team.id === player.teamId)
                        ?.name
                    }
                  </td>
                  <td>{player.position}</td>
                  <td>{player.age}</td>
                  <td>{player.appearances}</td>
                  <td>{player.minutes.toLocaleString("en-US")}</td>
                  <td>{player.goals}</td>
                  <td className="py-3">
                    <div className="space-y-1">
                      {POSITION_EVIDENCE[player.position]
                        .slice(0, 2)
                        .map((key) => {
                          const metric = player.officialMetrics[key];
                          return (
                            <span key={key} className="block text-xs">
                              <span className="text-[var(--ink-muted)]">
                                {METRIC_LABELS[key]}:
                              </span>{" "}
                              <strong>
                                {metric
                                  ? formatOfficialMetric(
                                      metric.per90 ?? metric.value,
                                      metric.per90 !== null
                                        ? "per90"
                                        : metric.unit,
                                    )
                                  : "Not available"}
                              </strong>
                            </span>
                          );
                        })}
                    </div>
                  </td>
                  <td>
                    <strong className="block tabular-nums">
                      {player.derivedScores.valueProxy?.toFixed(1) ?? "—"}
                    </strong>
                    <span className="text-xs text-[var(--ink-muted)]">
                      {player.derivedScores.status === "scored"
                        ? `${player.derivedScores.confidence}% confidence`
                        : "Not scored"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="flex justify-between">
            <h2 className="font-semibold">Shortlist</h2>
            <button
              onClick={() => setShortlist([])}
              className="text-xs text-[var(--ink-muted)]"
            >
              Clear
            </button>
          </div>
          <ol className="mt-5 space-y-3">
            {shortlist.map((id, index) => {
              const player = dataset.players.find((item) => item.id === id);
              return player ? (
                <li
                  key={id}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-3"
                >
                  <span>
                    <strong className="block text-sm">
                      {index + 1}. {player.name}
                    </strong>
                    <small className="text-[var(--ink-muted)]">
                      {player.position} · {player.age}
                    </small>
                  </span>
                  <button
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${player.name}`}
                  >
                    ×
                  </button>
                </li>
              ) : null;
            })}
          </ol>
          {shortlist.length === 0 && (
            <p className="mt-5 text-sm leading-6 text-[var(--ink-muted)]">
              Select up to five players from the table. Two players can be sent
              directly to comparison.
            </p>
          )}
        </aside>
      </div>
    </PageFrame>
  );
}
