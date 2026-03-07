"use client";

import type { RouteLeg } from "@/lib/pathfinding/types";
import { formatTime } from "@/lib/pathfinding/distance";

interface TripSummaryProps {
  routeLegs: RouteLeg[];
  speedKnots: number;
}

export function TripSummary({ routeLegs, speedKnots }: TripSummaryProps) {
  if (routeLegs.length === 0) {
    return (
      <p className="text-sm text-neutral-400 italic text-center py-4">
        No route yet
      </p>
    );
  }

  const totalDistanceNm = routeLegs.reduce(
    (sum, leg) => sum + leg.distanceNm,
    0
  );
  const totalTime = formatTime(totalDistanceNm, speedKnots);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
        Trip Summary
      </h3>

      <div className="flex gap-4 text-center">
        <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-blue-900">
            {totalDistanceNm.toFixed(1)} nm
          </div>
          <div className="text-xs text-blue-600">Total Distance</div>
        </div>
        <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2">
          <div className="text-lg font-bold text-blue-900">{totalTime}</div>
          <div className="text-xs text-blue-600">Est. Travel Time</div>
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs text-neutral-500 uppercase border-b border-neutral-200">
            <th className="text-left py-1 pr-1">#</th>
            <th className="text-left py-1">From</th>
            <th className="text-left py-1">To</th>
            <th className="text-right py-1">Dist</th>
            <th className="text-right py-1 pl-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {routeLegs.map((leg, i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className="py-1 pr-1 text-neutral-400">{i + 1}</td>
              {leg.path === null ? (
                <>
                  <td className="py-1">{leg.from.name}</td>
                  <td className="py-1">{leg.to.name}</td>
                  <td colSpan={2} className="py-1 text-right italic text-neutral-400">
                    No route found
                  </td>
                </>
              ) : (
                <>
                  <td className="py-1">{leg.from.name}</td>
                  <td className="py-1">{leg.to.name}</td>
                  <td className="py-1 text-right text-neutral-600">
                    {leg.distanceNm.toFixed(1)} nm
                  </td>
                  <td className="py-1 text-right pl-2 text-neutral-600">
                    {formatTime(leg.distanceNm, speedKnots)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
