import { describe, it, expect } from "vitest";
import { findPath, BinaryHeap } from "@/lib/pathfinding/astar";
import type { NavigationGrid } from "@/lib/grid/types";
import { isWater } from "@/lib/grid/types";
import { loadGrid } from "@/lib/grid/grid";

/**
 * Helper to create a small test grid.
 * data is row-major: 1=water, 0=land.
 */
function makeGrid(
  width: number,
  height: number,
  data: number[]
): NavigationGrid {
  return {
    width,
    height,
    bbox: [0, 0, width * 0.02, height * 0.02],
    cellSize: 0.02,
    data,
  };
}

describe("BinaryHeap", () => {
  it("extractMin returns lowest priority item", () => {
    const heap = new BinaryHeap<string>();
    heap.insert("c", 3);
    heap.insert("a", 1);
    heap.insert("b", 2);
    expect(heap.extractMin()).toBe("a");
    expect(heap.extractMin()).toBe("b");
    expect(heap.extractMin()).toBe("c");
  });

  it("returns correct size", () => {
    const heap = new BinaryHeap<number>();
    expect(heap.size).toBe(0);
    heap.insert(10, 5);
    heap.insert(20, 3);
    expect(heap.size).toBe(2);
    heap.extractMin();
    expect(heap.size).toBe(1);
  });

  it("maintains heap property after mixed insert/extract", () => {
    const heap = new BinaryHeap<number>();
    heap.insert(1, 10);
    heap.insert(2, 5);
    expect(heap.extractMin()).toBe(2); // priority 5
    heap.insert(3, 1);
    heap.insert(4, 8);
    expect(heap.extractMin()).toBe(3); // priority 1
    expect(heap.extractMin()).toBe(4); // priority 8
    expect(heap.extractMin()).toBe(1); // priority 10
  });

  it("returns undefined when empty", () => {
    const heap = new BinaryHeap<string>();
    expect(heap.extractMin()).toBeUndefined();
  });
});

describe("findPath", () => {
  it("finds path between two water cells on a 3x3 all-water grid", () => {
    // 3x3, all water
    const grid = makeGrid(3, 3, [1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const path = findPath(grid, [0, 0], [2, 2]);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThanOrEqual(2);
    expect(path![0]).toEqual([0, 0]);
    expect(path![path!.length - 1]).toEqual([2, 2]);
  });

  it("returns null when no path exists (surrounded by land)", () => {
    // 3x3: water at corners, land in middle row
    const grid = makeGrid(3, 3, [
      1, 0, 1,
      0, 0, 0,
      1, 0, 1,
    ]);
    const path = findPath(grid, [0, 0], [2, 2]);
    expect(path).toBeNull();
  });

  it("never includes land cells in returned path", () => {
    // 5x5 grid with a land barrier that must be routed around
    const grid = makeGrid(5, 5, [
      1, 1, 1, 1, 1,
      1, 1, 0, 1, 1,
      1, 0, 0, 0, 1,
      1, 1, 0, 1, 1,
      1, 1, 1, 1, 1,
    ]);
    const path = findPath(grid, [0, 0], [4, 4]);
    expect(path).not.toBeNull();
    for (const [col, row] of path!) {
      expect(isWater(grid, col, row)).toBe(true);
    }
  });

  it("uses diagonal movement -- (0,0) to (2,2) on open water takes ~3 cells (diagonal)", () => {
    const grid = makeGrid(3, 3, [1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const path = findPath(grid, [0, 0], [2, 2]);
    expect(path).not.toBeNull();
    // Diagonal path: (0,0) -> (1,1) -> (2,2) = 3 cells
    expect(path!.length).toBe(3);
  });

  it("returns single-cell path when start equals end", () => {
    const grid = makeGrid(3, 3, [1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const path = findPath(grid, [1, 1], [1, 1]);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
    expect(path![0]).toEqual([1, 1]);
  });

  it("returns null when start is on land", () => {
    const grid = makeGrid(3, 3, [0, 1, 1, 1, 1, 1, 1, 1, 1]);
    const path = findPath(grid, [0, 0], [2, 2]);
    expect(path).toBeNull();
  });

  it("performance: finds path on real navigation grid in under 2000ms", () => {
    const grid = loadGrid();
    // Duluth, MN area: roughly col ~50, row ~30
    // Buffalo, NY area: roughly col ~780, row ~230
    // We need to find actual water cells, so use findNearestWaterCell approach
    // For this test, let's find two distant water cells manually
    let startCell: [number, number] | null = null;
    let endCell: [number, number] | null = null;

    // Find a water cell near top-left (Lake Superior)
    for (let row = 20; row < 100; row++) {
      for (let col = 20; col < 150; col++) {
        if (isWater(grid, col, row)) {
          startCell = [col, row];
          break;
        }
      }
      if (startCell) break;
    }

    // Find a water cell near bottom-right (Lake Erie/Ontario)
    for (let row = 300; row > 200; row--) {
      for (let col = 800; col > 600; col--) {
        if (isWater(grid, col, row)) {
          endCell = [col, row];
          break;
        }
      }
      if (endCell) break;
    }

    expect(startCell).not.toBeNull();
    expect(endCell).not.toBeNull();

    const start = performance.now();
    const path = findPath(grid, startCell!, endCell!);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    // Path may be null if cells aren't connected -- that's ok for perf test
    // But if it finds a path, every cell must be water
    if (path) {
      for (const [col, row] of path) {
        expect(isWater(grid, col, row)).toBe(true);
      }
    }
  });
});
