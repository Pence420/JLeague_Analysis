"use client";

import { useEffect, useState } from "react";
import { sampleLeagueDataset } from "@/features/league-intelligence/sample-data";
import type { LeagueDataset } from "@/features/league-intelligence/types";
import { fetchLeagueDataset, isApiConfigured } from "./client";

export function useLeagueDataset() {
  const [dataset, setDataset] = useState<LeagueDataset>(sampleLeagueDataset);
  const [dataSource, setDataSource] = useState<"api" | "local">("local");

  useEffect(() => {
    if (!isApiConfigured) return;
    const controller = new AbortController();
    fetchLeagueDataset(controller.signal)
      .then((nextDataset) => {
        setDataset(nextDataset);
        setDataSource("api");
      })
      .catch(() => {
        if (!controller.signal.aborted) setDataSource("local");
      });
    return () => controller.abort();
  }, []);

  return { dataset, dataSource };
}
