import { describe, it, expect } from "vitest";
import { loadGrid, toCell, isWater } from "@/lib/grid/grid";

describe("Grid performance (DATA-02)", () => {
  it("loadGrid() completes in under 1 second", () => {
    const start = performance.now();
    const grid = loadGrid();
    const elapsed = performance.now() - start;
    expect(grid).toBeDefined();
    expect(elapsed).toBeLessThan(1000);
  });

  it("toCell() executes 1000 lookups in under 100ms", () => {
    const grid = loadGrid();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Vary coordinates across the grid bbox
      const lng = grid.bbox[0] + Math.random() * (grid.bbox[2] - grid.bbox[0]);
      const lat = grid.bbox[1] + Math.random() * (grid.bbox[3] - grid.bbox[1]);
      toCell(grid, lng, lat);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it("isWater() executes 1000 lookups in under 100ms", () => {
    const grid = loadGrid();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const col = Math.floor(Math.random() * grid.width);
      const row = Math.floor(Math.random() * grid.height);
      isWater(grid, col, row);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
