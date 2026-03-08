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
 * Patch narrow waterway gaps in the grid.
 * The Detroit River / St. Clair River corridor has gaps at ~2km resolution
 * that prevent A* from finding Lake Erie → Lake Huron routes.
 * This fills a narrow bridge of water cells to ensure connectivity.
 */
function patchWaterwayGaps(grid: NavigationGrid): void {
  const { bbox, cellSize, width, data } = grid;

  function lngLatToCell(lng: number, lat: number): [number, number] {
    const col = Math.floor((lng - bbox[0]) / cellSize);
    const row = Math.floor((bbox[3] - lat) / cellSize);
    return [col, row];
  }

  function setWater(col: number, row: number) {
    if (col >= 0 && col < width && row >= 0 && row < grid.height) {
      data[row * width + col] = 1;
    }
  }

  // Detroit River corridor: fill a wide water path connecting
  // Lake Erie (ends ~lat 42.04) to Lake St. Clair (starts ~lat 42.22)
  // Bridge at lng -83.10 through -82.90 for robust connectivity
  for (let lat = 42.00; lat <= 42.36; lat += cellSize) {
    for (let lng = -83.18; lng <= -82.90; lng += cellSize) {
      const [col, row] = lngLatToCell(lng, lat);
      setWater(col, row);
    }
  }

  // St. Clair River: connect Lake St. Clair to Lake Huron
  // Wide bridge from lat 42.48 to 43.02, lng -82.60 to -82.30
  for (let lat = 42.48; lat <= 43.05; lat += cellSize) {
    for (let lng = -82.62; lng <= -82.28; lng += cellSize) {
      const [col, row] = lngLatToCell(lng, lat);
      setWater(col, row);
    }
  }
}

/**
 * Load the pre-computed navigation grid.
 */
export function loadGrid(): NavigationGrid {
  const grid = { ...gridData, data: [...gridData.data] } as NavigationGrid;
  patchWaterwayGaps(grid);
  return grid;
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
