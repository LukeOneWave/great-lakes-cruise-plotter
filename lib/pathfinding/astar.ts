/**
 * astar.ts
 *
 * A* pathfinding on the navigation grid with 8-directional movement.
 * Uses a binary min-heap priority queue for efficient frontier expansion.
 * Guarantees water-only paths by checking isWater on every neighbor.
 */

import type { NavigationGrid, GridCell } from "@/lib/grid/types";
import { isWater } from "@/lib/grid/types";

const SQRT2 = Math.SQRT2;

// 8-directional movement: [dcol, drow, cost]
const DIRECTIONS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

/**
 * Min-heap priority queue using array-based binary heap.
 */
export class BinaryHeap<T> {
  private items: T[] = [];
  private priorities: number[] = [];

  get size(): number {
    return this.items.length;
  }

  insert(item: T, priority: number): void {
    this.items.push(item);
    this.priorities.push(priority);
    this.bubbleUp(this.items.length - 1);
  }

  extractMin(): T | undefined {
    if (this.items.length === 0) return undefined;
    const min = this.items[0];
    const lastItem = this.items.pop()!;
    const lastPri = this.priorities.pop()!;
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.priorities[0] = lastPri;
      this.sinkDown(0);
    }
    return min;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorities[i] < this.priorities[parent]) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(i: number): void {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.priorities[left] < this.priorities[smallest]) {
        smallest = left;
      }
      if (right < n && this.priorities[right] < this.priorities[smallest]) {
        smallest = right;
      }
      if (smallest !== i) {
        this.swap(i, smallest);
        i = smallest;
      } else {
        break;
      }
    }
  }

  private swap(a: number, b: number): void {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.priorities[a], this.priorities[b]] = [
      this.priorities[b],
      this.priorities[a],
    ];
  }
}

/**
 * Octile distance heuristic for 8-directional grids.
 * Admissible and consistent -- guarantees optimal paths.
 */
function octileDistance(
  col1: number,
  row1: number,
  col2: number,
  row2: number
): number {
  const dx = Math.abs(col1 - col2);
  const dy = Math.abs(row1 - row2);
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

/**
 * Encode a grid cell as a single integer key for Map lookups.
 */
function cellKey(col: number, row: number, width: number): number {
  return row * width + col;
}

/**
 * A* pathfinding on the navigation grid.
 *
 * Returns an array of GridCells from start to end (inclusive),
 * or null if no water-only path exists.
 */
export function findPath(
  grid: NavigationGrid,
  start: GridCell,
  end: GridCell
): GridCell[] | null {
  const [startCol, startRow] = start;
  const [endCol, endRow] = end;

  // Guard: start and end must be water
  if (!isWater(grid, startCol, startRow) || !isWater(grid, endCol, endRow)) {
    return null;
  }

  // Same cell
  if (startCol === endCol && startRow === endRow) {
    return [[startCol, startRow]];
  }

  const w = grid.width;
  const startKey = cellKey(startCol, startRow, w);
  const endKey = cellKey(endCol, endRow, w);

  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const openSet = new BinaryHeap<number>();

  gScore.set(startKey, 0);
  openSet.insert(startKey, octileDistance(startCol, startRow, endCol, endRow));

  while (openSet.size > 0) {
    const currentKey = openSet.extractMin()!;

    if (currentKey === endKey) {
      // Reconstruct path
      return reconstructPath(cameFrom, currentKey, w);
    }

    const currentRow = Math.floor(currentKey / w);
    const currentCol = currentKey % w;
    const currentG = gScore.get(currentKey)!;

    for (const [dc, dr, cost] of DIRECTIONS) {
      const nc = currentCol + dc;
      const nr = currentRow + dr;

      if (!isWater(grid, nc, nr)) continue;

      const neighborKey = cellKey(nc, nr, w);
      const tentativeG = currentG + cost;

      const existingG = gScore.get(neighborKey);
      if (existingG !== undefined && tentativeG >= existingG) continue;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeG);

      const f = tentativeG + octileDistance(nc, nr, endCol, endRow);
      openSet.insert(neighborKey, f);
    }
  }

  return null;
}

function reconstructPath(
  cameFrom: Map<number, number>,
  endKey: number,
  width: number
): GridCell[] {
  const path: GridCell[] = [];
  let current = endKey;
  while (current !== undefined) {
    const row = Math.floor(current / width);
    const col = current % width;
    path.push([col, row]);
    const prev = cameFrom.get(current);
    if (prev === undefined) break;
    current = prev;
  }
  path.reverse();
  return path;
}
