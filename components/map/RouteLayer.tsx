"use client";

import type { GeoProjection } from "d3-geo";
import type { RoutePoint } from "@/lib/pathfinding/types";
import { NAUTICAL_COLORS } from "./constants";

interface RouteLayerProps {
  routePoints: RoutePoint[];
  projection: GeoProjection;
}

/**
 * Interpolate additional points along projected path segments at ~interval px spacing.
 * This ensures arrow markers (marker-mid) are evenly distributed regardless of path simplification.
 */
function interpolatePoints(
  projected: [number, number][],
  interval: number = 40
): [number, number][] {
  if (projected.length < 2) return projected;

  const result: [number, number][] = [projected[0]];

  for (let i = 1; i < projected.length; i++) {
    const [x0, y0] = result[result.length - 1];
    const [x1, y1] = projected[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > interval) {
      const steps = Math.floor(dist / interval);
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        result.push([x0 + dx * t, y0 + dy * t]);
      }
    }

    result.push(projected[i]);
  }

  return result;
}

export function RouteLayer({ routePoints, projection }: RouteLayerProps) {
  if (!routePoints || routePoints.length < 2) return null;

  // Project each RoutePoint [lng, lat] through projection to get [x, y]
  const projected: [number, number][] = [];
  for (const pt of routePoints) {
    const p = projection([pt.lng, pt.lat]);
    if (p) projected.push([p[0], p[1]]);
  }

  if (projected.length < 2) return null;

  // Interpolate for even arrow spacing
  const interpolated = interpolatePoints(projected);

  // Build SVG path d attribute
  const d = interpolated
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0]},${pt[1]}`)
    .join(" ");

  return (
    <g className="route-layer">
      <defs>
        <marker
          id="route-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={NAUTICAL_COLORS.routeArrow} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={NAUTICAL_COLORS.routeLine}
        strokeWidth={2.5}
        strokeDasharray="8,4"
        strokeLinecap="round"
        markerMid="url(#route-arrow)"
        opacity={0.85}
      />
    </g>
  );
}
