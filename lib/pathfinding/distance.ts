import { geoDistance } from "d3-geo";
import type { RoutePoint } from "./types";

const EARTH_RADIUS_NM = 3440.065;

/**
 * Compute total distance in nautical miles along a series of route points.
 */
export function computeDistanceNm(points: RoutePoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a: [number, number] = [points[i - 1].lng, points[i - 1].lat];
    const b: [number, number] = [points[i].lng, points[i].lat];
    total += geoDistance(a, b) * EARTH_RADIUS_NM;
  }
  return total;
}

/**
 * Format travel time from distance and speed.
 * Returns "Xh Ym" or just "Ym" if under 1 hour.
 */
export function formatTime(distanceNm: number, speedKnots: number): string {
  if (distanceNm === 0) return "0m";
  const totalMinutes = Math.round((distanceNm / speedKnots) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
