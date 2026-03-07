import { describe, it, expect } from "vitest";
import { loadGrid, toCell, isWater } from "@/lib/grid/grid";
import type { NavigationGrid } from "@/lib/grid/types";

describe("Navigation grid and waterway validation (DATA-02)", () => {
  const grid = loadGrid();

  it("loads successfully with valid structure", () => {
    expect(grid.width).toBeGreaterThan(0);
    expect(grid.height).toBeGreaterThan(0);
    expect(grid.bbox).toHaveLength(4);
    expect(grid.cellSize).toBeGreaterThan(0);
    expect(grid.data).toBeDefined();
    expect(grid.data.length).toBe(grid.width * grid.height);
  });

  it("grid dimensions match expected resolution", () => {
    // At 0.02 degree cellSize, expect ~850x425 (for bbox ~17 deg wide x 8.5 deg tall)
    const expectedWidth = Math.ceil(
      (grid.bbox[2] - grid.bbox[0]) / grid.cellSize
    );
    const expectedHeight = Math.ceil(
      (grid.bbox[3] - grid.bbox[1]) / grid.cellSize
    );
    expect(grid.width).toBe(expectedWidth);
    expect(grid.height).toBe(expectedHeight);
  });

  it("water cell percentage is between 15-50%", () => {
    const waterCount = grid.data.filter((v) => v === 1).length;
    const totalCells = grid.width * grid.height;
    const waterPercent = (waterCount / totalCells) * 100;
    expect(waterPercent).toBeGreaterThan(15);
    expect(waterPercent).toBeLessThan(50);
  });

  describe("waterway checkpoint validation", () => {
    const waterways: {
      name: string;
      points: [number, number][];
    }[] = [
      {
        name: "Straits of Mackinac",
        points: [
          [-84.9, 45.78],
          [-84.7, 45.8],
          [-84.6, 45.82],
        ],
      },
      {
        name: "St. Marys River",
        points: [
          [-84.35, 46.48],
          [-84.35, 46.43],
          [-84.35, 46.38],
        ],
      },
      {
        name: "Detroit River / Lake St. Clair",
        points: [
          [-82.42, 42.95],
          [-82.7, 42.45],
          [-83.1, 42.3],
        ],
      },
      {
        name: "Welland Canal",
        points: [
          [-79.22, 42.9],
          [-79.22, 43.05],
          [-79.22, 43.15],
        ],
      },
      {
        name: "Upper St. Lawrence",
        points: [
          [-76.3, 44.2],
          [-76.0, 44.3],
          [-75.7, 44.4],
        ],
      },
    ];

    for (const waterway of waterways) {
      describe(waterway.name, () => {
        for (const point of waterway.points) {
          it(`has water at [${point[0]}, ${point[1]}]`, () => {
            const [col, row] = toCell(grid, point[0], point[1]);
            const water = isWater(grid, col, row);
            expect(
              water,
              `${waterway.name} at [${point[0]}, ${point[1]}] (cell [${col}, ${row}]) should be water`
            ).toBe(true);
          });
        }
      });
    }
  });

  describe("waterway connectivity (BFS)", () => {
    /**
     * BFS within a bounded region to check if two cells are connected by water.
     */
    function areConnected(
      grid: NavigationGrid,
      startCol: number,
      startRow: number,
      endCol: number,
      endRow: number,
      maxSearchRadius: number = 20
    ): boolean {
      const key = (c: number, r: number) => `${c},${r}`;
      const visited = new Set<string>();
      const queue: [number, number][] = [[startCol, startRow]];
      visited.add(key(startCol, startRow));

      const minCol = Math.min(startCol, endCol) - maxSearchRadius;
      const maxCol = Math.max(startCol, endCol) + maxSearchRadius;
      const minRow = Math.min(startRow, endRow) - maxSearchRadius;
      const maxRow = Math.max(startRow, endRow) + maxSearchRadius;

      while (queue.length > 0) {
        const [c, r] = queue.shift()!;
        if (c === endCol && r === endRow) return true;

        for (const [dc, dr] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const nc = c + dc;
          const nr = r + dr;
          if (nc < minCol || nc > maxCol || nr < minRow || nr > maxRow)
            continue;
          const k = key(nc, nr);
          if (visited.has(k)) continue;
          visited.add(k);
          if (isWater(grid, nc, nr)) {
            queue.push([nc, nr]);
          }
        }
      }
      return false;
    }

    const connectivityPairs: {
      name: string;
      from: [number, number];
      to: [number, number];
    }[] = [
      {
        name: "Straits of Mackinac",
        from: [-84.9, 45.78],
        to: [-84.6, 45.82],
      },
      {
        name: "St. Marys River",
        from: [-84.35, 46.48],
        to: [-84.35, 46.38],
      },
      {
        name: "Detroit River / Lake St. Clair",
        from: [-82.7, 42.45],
        to: [-83.1, 42.3],
      },
      {
        name: "Welland Canal",
        from: [-79.22, 42.9],
        to: [-79.22, 43.15],
      },
      {
        name: "Upper St. Lawrence",
        from: [-76.3, 44.2],
        to: [-75.7, 44.4],
      },
    ];

    for (const pair of connectivityPairs) {
      it(`${pair.name} has connected water path`, () => {
        const [sc, sr] = toCell(grid, pair.from[0], pair.from[1]);
        const [ec, er] = toCell(grid, pair.to[0], pair.to[1]);
        const connected = areConnected(grid, sc, sr, ec, er, 50);
        expect(
          connected,
          `${pair.name}: cells [${sc},${sr}] and [${ec},${er}] should be connected by water`
        ).toBe(true);
      });
    }
  });
});
