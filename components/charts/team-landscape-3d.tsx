"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Box, Maximize2 } from "lucide-react";
import { useState } from "react";
import type {
  MetricKey,
  TeamLandscapePoint,
} from "@/features/league-intelligence/types";
import { metricLabels, TeamLandscapeFallback } from "./team-landscape-fallback";

const clusterColors: Record<TeamLandscapePoint["cluster"], string> = {
  "Territorial controller": "#3c3e3d",
  "Direct transition": "#777a78",
  "Defensive disruptor": "#a3a5a2",
  "Compact pragmatist": "#c0c1be",
};

function Scene({
  points,
  selectedTeamId,
  onSelectTeam,
  reduceMotion,
}: {
  points: TeamLandscapePoint[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  reduceMotion: boolean;
}) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <gridHelper
        args={[5.5, 11, "#b9bbb7", "#e4e4df"]}
        position={[0, -1.15, 0]}
      />
      {points.map((point) => {
        const selected = selectedTeamId === point.teamId;
        return (
          <group
            key={point.teamId}
            position={[point.x * 2.1, point.y * 1.7, point.z * 2.1]}
          >
            <mesh
              onClick={(event) => {
                event.stopPropagation();
                onSelectTeam(point.teamId);
              }}
              scale={selected ? 1.32 : 1}
            >
              <sphereGeometry args={[0.16 + point.coverage / 900, 32, 32]} />
              <meshStandardMaterial
                color={selected ? "#7f1734" : clusterColors[point.cluster]}
                roughness={0.42}
                metalness={0.04}
                emissive={selected ? "#7f1734" : "#000000"}
                emissiveIntensity={selected ? 0.12 : 0}
              />
            </mesh>
            {selected && (
              <mesh scale={1.55}>
                <sphereGeometry args={[0.25, 28, 28]} />
                <meshBasicMaterial color="#7f1734" transparent opacity={0.1} />
              </mesh>
            )}
          </group>
        );
      })}
      <OrbitControls
        enablePan={false}
        minDistance={5.8}
        maxDistance={9.2}
        autoRotate={!reduceMotion}
        autoRotateSpeed={0.35}
        minPolarAngle={0.55}
        maxPolarAngle={1.45}
      />
    </>
  );
}

export function TeamLandscape({
  points,
  axes,
  selectedTeamId,
  onSelectTeam,
  forceFallback = false,
  onAxisChange,
}: {
  points: TeamLandscapePoint[];
  axes: readonly [MetricKey, MetricKey, MetricKey];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  forceFallback?: boolean;
  onAxisChange?: (index: 0 | 1 | 2, value: MetricKey) => void;
}) {
  const [webglFailed] = useState(() => {
    if (forceFallback || typeof document === "undefined") return forceFallback;
    try {
      const canvas = document.createElement("canvas");
      return !canvas.getContext("webgl2") && !canvas.getContext("webgl");
    } catch {
      return true;
    }
  });
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const options = Object.entries(metricLabels) as Array<[MetricKey, string]>;
  return (
    <section
      className="surface-card p-5"
      aria-labelledby="team-landscape-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Playing-style model</p>
          <h2 id="team-landscape-title" className="module-title">
            Team Style Landscape
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Three analytical dimensions · rotate, zoom, or use the data table
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white">
          <Box size={14} /> 3D view
        </span>
      </div>
      {onAxisChange && (
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {axes.map((axis, index) => (
            <label
              key={`${axis}-${index}`}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--ink-muted)]"
            >
              {["X axis", "Y axis", "Z axis"][index]}
              <select
                className="mt-1 block w-full bg-transparent text-sm font-semibold text-[var(--ink)]"
                value={axis}
                onChange={(event) =>
                  onAxisChange(
                    index as 0 | 1 | 2,
                    event.target.value as MetricKey,
                  )
                }
              >
                {options.map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    disabled={axes.some(
                      (selected, otherIndex) =>
                        selected === value && otherIndex !== index,
                    )}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      {webglFailed ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--ink)]">
          3D view is unavailable in this browser. The complete team-style data
          remains available below.
        </div>
      ) : (
        <div className="relative mt-5 h-[420px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
          <Canvas
            camera={{ position: [5.3, 4.2, 6.1], fov: 43 }}
            onCreated={({ gl }) => gl.setClearColor("#f7f7f3")}
          >
            <Scene
              points={points}
              selectedTeamId={selectedTeamId}
              onSelectTeam={onSelectTeam}
              reduceMotion={reduceMotion}
            />
          </Canvas>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
            <span>{metricLabels[axes[0]]}</span>
            <span className="flex items-center gap-1">
              <Maximize2 size={12} /> Drag to inspect
            </span>
            <span>{metricLabels[axes[2]]}</span>
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(clusterColors).map(([cluster, color]) => (
          <span
            key={cluster}
            className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]"
          >
            <i
              className="size-2.5 rounded-full"
              style={{ background: color }}
            />
            {cluster}
          </span>
        ))}
      </div>
      <TeamLandscapeFallback
        points={points}
        axes={axes}
        selectedTeamId={selectedTeamId}
        onSelectTeam={onSelectTeam}
        expanded={webglFailed}
      />
    </section>
  );
}
