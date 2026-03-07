"use client";

import { useMemo, useState, useCallback } from "react";
import { NauticalMap } from "@/components/map/NauticalMap";
import { getAllPorts } from "@/lib/ports/ports";
import { loadGrid } from "@/lib/grid/grid";
import { findRoute } from "@/lib/pathfinding/route";

export default function Home() {
  const ports = useMemo(() => getAllPorts(), []);
  const grid = useMemo(() => loadGrid(), []);
  const [selectedPortIds, setSelectedPortIds] = useState<Set<string>>(
    new Set()
  );

  const routeResult = useMemo(() => {
    const ids = Array.from(selectedPortIds);
    if (ids.length !== 2) return null;
    return findRoute(grid, ids[0], ids[1]);
  }, [grid, selectedPortIds]);

  const handlePortSelect = useCallback((portId: string) => {
    setSelectedPortIds((prev) => {
      const next = new Set(prev);
      if (next.has(portId)) {
        next.delete(portId);
      } else {
        next.add(portId);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <header className="flex items-center px-6 py-3 bg-white border-b border-neutral-200 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight font-sans">
          Great Lakes Cruise Plotter
        </h1>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <NauticalMap
          ports={ports}
          selectedPortIds={selectedPortIds}
          onPortSelect={handlePortSelect}
          routePoints={routeResult?.points}
        />
      </main>
    </div>
  );
}
