/**
 * route.ts
 *
 * High-level route finder that connects port IDs to the A* pathfinding engine.
 * Handles port lookup, water-cell snapping, pathfinding, and path simplification.
 */

import type { NavigationGrid, GridCell } from "@/lib/grid/types";
import type { PathResult, RoutePoint } from "@/lib/pathfinding/types";
import { findNearestWaterCell } from "@/lib/grid/grid";
import { getPortById } from "@/lib/ports/ports";
import { findPath } from "@/lib/pathfinding/astar";
import { simplifyPath } from "@/lib/pathfinding/simplify";

/**
 * Convert a grid cell to [lng, lat] geographic coordinates.
 * Uses cell center for accuracy.
 */
export function cellToLatLng(
  grid: NavigationGrid,
  col: number,
  row: number
): [lng: number, lat: number] {
  const lng = grid.bbox[0] + (col + 0.5) * grid.cellSize;
  const lat = grid.bbox[3] - (row + 0.5) * grid.cellSize;
  return [lng, lat];
}

/**
 * Find a water-only route between two ports.
 *
 * @param grid - The navigation grid
 * @param startPortId - ID of the departure port
 * @param endPortId - ID of the destination port
 * @returns PathResult with simplified lat/lng points, or null if route impossible
 */
export function findRoute(
  grid: NavigationGrid,
  startPortId: string,
  endPortId: string
): PathResult | null {
  // 1. Look up ports
  const startPort = getPortById(startPortId);
  const endPort = getPortById(endPortId);
  if (!startPort || !endPort) return null;

  // 2. Snap port coordinates to nearest water cells
  const startCell = findNearestWaterCell(grid, startPort.lng, startPort.lat);
  const endCell = findNearestWaterCell(grid, endPort.lng, endPort.lat);
  if (!startCell || !endCell) return null;

  // 3. Run A* pathfinding
  const rawPath = findPath(grid, startCell, endCell);
  if (!rawPath) return null;

  // 4. Convert grid cells to [lng, lat] coordinates
  const coords: [number, number][] = rawPath.map(([col, row]) =>
    cellToLatLng(grid, col, row)
  );

  // 5. Simplify path (epsilon in degree space, ~1km at Great Lakes latitude)
  const simplified = simplifyPath(coords, 0.01);

  // 6. Map to RoutePoint array
  const points: RoutePoint[] = simplified.map(([lng, lat]) => ({ lng, lat }));

  // 7. Return result
  return {
    points,
    gridCellCount: rawPath.length,
  };
}
