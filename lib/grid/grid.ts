/**
 * grid.ts
 *
 * Navigation grid loader and cell lookup utilities.
 * Provides grid loading, cell coordinate conversion, water detection,
 * and nearest-water-cell snapping for ports on land boundaries.
 */

import type { NavigationGrid, GridCell } from "./types";
import { toCell, isWater } from "./types";
import gridData from "./navigation-grid.json";

export { toCell, isWater };

/**
 * Load the pre-computed navigation grid.
 */
export function loadGrid(): NavigationGrid {
  return gridData as NavigationGrid;
}

/**
 * Find the nearest water cell to a given coordinate.
 * Useful for snapping port locations that may fall on land
 * due to grid resolution or coastline simplification.
 *
 * Searches in expanding rings around the target cell up to maxRadius.
 * Returns null if no water cell found within radius.
 */
export function findNearestWaterCell(
  grid: NavigationGrid,
  lng: number,
  lat: number,
  maxRadius: number = 10
): GridCell | null {
  const [centerCol, centerRow] = toCell(grid, lng, lat);

  // Check center first
  if (isWater(grid, centerCol, centerRow)) {
    return [centerCol, centerRow];
  }

  // Search in expanding rings
  for (let r = 1; r <= maxRadius; r++) {
    let bestCell: GridCell | null = null;
    let bestDist = Infinity;

    // Check all cells at ring distance r
    for (let dr = -r; dr <= r; dr++) {
      for (let dc = -r; dc <= r; dc++) {
        // Only check cells on the ring boundary
        if (Math.abs(dr) !== r && Math.abs(dc) !== r) continue;

        const col = centerCol + dc;
        const row = centerRow + dr;

        if (isWater(grid, col, row)) {
          const dist = Math.sqrt(dc * dc + dr * dr);
          if (dist < bestDist) {
            bestDist = dist;
            bestCell = [col, row];
          }
        }
      }
    }

    if (bestCell) {
      return bestCell;
    }
  }

  return null;
}
