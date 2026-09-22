"use client";

import { useMemo, useState } from "react";
import { useLeagueDataset } from "@/features/api/use-league-dataset";
import { buildLeagueDashboard, DEFAULT_AXES } from "./analytics";
import type { MetricKey } from "./types";

export function useLeagueDashboard() {
  const { dataset, dataSource } = useLeagueDataset();
  const [minimumMinutes, setMinimumMinutes] = useState<450 | 900>(900);
  const [axes, setAxes] =
    useState<readonly [MetricKey, MetricKey, MetricKey]>(DEFAULT_AXES);
  const viewModel = useMemo(
    () => buildLeagueDashboard(dataset, { minimumMinutes, axes }),
    [dataset, minimumMinutes, axes],
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    viewModel.leagueState[0]?.teamId ?? null,
  );
  const setAxis = (index: 0 | 1 | 2, metric: MetricKey) =>
    setAxes(
      (current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? metric : item,
        ) as unknown as readonly [MetricKey, MetricKey, MetricKey],
    );
  return {
    dataset,
    dataSource,
    viewModel,
    selectedTeamId,
    setSelectedTeamId,
    axes,
    setAxis,
    minimumMinutes,
    setMinimumMinutes,
  };
}
