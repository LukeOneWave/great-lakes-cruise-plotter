"use client";

import { StopList } from "./StopList";
import type { Port } from "@/lib/ports/types";
import type { RouteLeg } from "@/lib/pathfinding/types";

interface RoutePlannerPanelProps {
  stops: Port[];
  routeLegs: RouteLeg[];
  speedKnots: number;
  onSpeedChange: (speed: number) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}

export function RoutePlannerPanel({
  stops,
  routeLegs,
  speedKnots,
  onSpeedChange,
  onReorder,
  onRemove,
}: RoutePlannerPanelProps) {
  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      <h2 className="text-lg font-semibold text-neutral-800 tracking-tight border-b border-neutral-200 pb-2">
        Route Planner
      </h2>
      <StopList stops={stops} onReorder={onReorder} onRemove={onRemove} />
      {/* TripSummary placeholder (Plan 02) */}
      {/* SpeedControl placeholder (Plan 02) */}
    </div>
  );
}
