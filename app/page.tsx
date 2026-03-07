"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { NauticalMap } from "@/components/map/NauticalMap";
import { getAllPorts, getPortById } from "@/lib/ports/ports";
import { loadGrid } from "@/lib/grid/grid";
import { findRoute } from "@/lib/pathfinding/route";
import { computeDistanceNm } from "@/lib/pathfinding/distance";
import { RoutePlannerPanel } from "@/components/route-planner/RoutePlannerPanel";
import type { RouteLeg } from "@/lib/pathfinding/types";
import { ExportMenu } from "@/components/ui/ExportMenu";
import type { Port } from "@/lib/ports/types";

export default function Home() {
  const svgRef = useRef<SVGSVGElement>(null);
  const ports = useMemo(() => getAllPorts(), []);
  const grid = useMemo(() => loadGrid(), []);
  const [stops, setStops] = useState<string[]>([]);
  const [speedKnots, setSpeedKnots] = useState(10);

  const stopPorts = useMemo(
    () =>
      stops
        .map((id) => getPortById(id))
        .filter((p): p is Port => p !== undefined),
    [stops]
  );

  const routeLegs = useMemo<RouteLeg[]>(() => {
    if (stops.length < 2) return [];
    const legs: RouteLeg[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const from = getPortById(stops[i]);
      const to = getPortById(stops[i + 1]);
      if (!from || !to) continue;
      const path = findRoute(grid, stops[i], stops[i + 1]);
      legs.push({
        from,
        to,
        path,
        distanceNm: path ? computeDistanceNm(path.points) : 0,
      });
    }
    return legs;
  }, [stops, grid]);

  const allRoutePoints = useMemo(
    () => routeLegs.flatMap((leg) => leg.path?.points ?? []),
    [routeLegs]
  );

  const selectedPortIds = useMemo(() => new Set(stops), [stops]);

  const tripSummary = useMemo(() => {
    if (routeLegs.length === 0 || stopPorts.length < 2) return undefined;
    const totalNm = routeLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
    const totalHours = totalNm / speedKnots;
    const stopNames = stopPorts.map((p) => p.name).join(" -> ");
    return `Route: ${stopNames} | ${totalNm.toFixed(1)} nm | ~${totalHours.toFixed(1)} hrs at ${speedKnots} kts`;
  }, [routeLegs, stopPorts, speedKnots]);

  const handlePortSelect = useCallback((portId: string) => {
    setStops((prev) => {
      const idx = prev.indexOf(portId);
      if (idx >= 0) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return [...prev, portId];
    });
  }, []);

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const removeStop = useCallback((index: number) => {
    setStops((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-neutral-200 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight font-sans">
          Great Lakes Cruise Plotter
        </h1>
        <ExportMenu svgRef={svgRef} tripSummary={tripSummary} />
      </header>
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="flex-1 min-h-[400px] flex items-center justify-center p-4">
          <NauticalMap
            ref={svgRef}
            ports={ports}
            selectedPortIds={selectedPortIds}
            onPortSelect={handlePortSelect}
            routePoints={allRoutePoints}
          />
        </div>
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white overflow-y-auto">
          <RoutePlannerPanel
            stops={stopPorts}
            routeLegs={routeLegs}
            speedKnots={speedKnots}
            onSpeedChange={setSpeedKnots}
            onReorder={reorderStops}
            onRemove={removeStop}
          />
        </div>
      </main>
    </div>
  );
}
