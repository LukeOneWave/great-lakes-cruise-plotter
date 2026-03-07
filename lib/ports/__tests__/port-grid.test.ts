import { describe, it, expect } from "vitest";
import { getAllPorts } from "@/lib/ports/ports";
import { loadGrid, toCell, isWater, findNearestWaterCell } from "@/lib/grid/grid";
import type { GreatLakeName } from "@/lib/geo/types";

describe("Port-grid integration (DATA-01/02/03)", () => {
  const grid = loadGrid();
  const ports = getAllPorts();

  it("every port maps to a valid cell within grid bounds", () => {
    for (const port of ports) {
      const [col, row] = toCell(grid, port.lng, port.lat);
      expect(
        col >= 0 && col < grid.width,
        `${port.name} col ${col} out of bounds [0, ${grid.width})`
      ).toBe(true);
      expect(
        row >= 0 && row < grid.height,
        `${port.name} row ${row} out of bounds [0, ${grid.height})`
      ).toBe(true);
    }
  });

  it("every port is on water or has a nearby water cell (within 10 cells at 0.02deg grid)", () => {
    // At 0.02 degree grid resolution (~2km cells), many waterfront ports land on
    // land cells. We verify every port has reachable water within 10 cells (~20km).
    const failedPorts: string[] = [];

    for (const port of ports) {
      const nearest = findNearestWaterCell(grid, port.lng, port.lat, 10);
      if (!nearest) {
        failedPorts.push(`${port.name} (${port.lake}) at [${port.lng}, ${port.lat}]`);
      }
    }

    expect(
      failedPorts,
      `Ports with no water within 10 cells: ${failedPorts.join(", ")}`
    ).toHaveLength(0);
  });

  it("snapping rate is reasonable for 0.02-degree grid", () => {
    // At 0.02 degree resolution, waterfront ports may not land directly on water cells.
    // Up to 80% snap rate is acceptable -- the important thing is that all ports
    // have nearby water within findNearestWaterCell radius.
    let needSnap = 0;
    for (const port of ports) {
      const [col, row] = toCell(grid, port.lng, port.lat);
      if (!isWater(grid, col, row)) {
        needSnap++;
      }
    }
    const snapPercent = (needSnap / ports.length) * 100;
    console.log(`Snap rate: ${needSnap}/${ports.length} (${snapPercent.toFixed(1)}%)`);
    expect(
      snapPercent,
      `${needSnap}/${ports.length} ports (${snapPercent.toFixed(1)}%) need snapping -- max 80% allowed at 0.02deg resolution`
    ).toBeLessThanOrEqual(80);
  });

  it("no port has zero water within 10 cells", () => {
    const unreachable: string[] = [];

    for (const port of ports) {
      const nearest = findNearestWaterCell(grid, port.lng, port.lat, 10);
      if (!nearest) {
        unreachable.push(`${port.name} (${port.lake}) at [${port.lng}, ${port.lat}]`);
      }
    }

    expect(
      unreachable,
      `Unreachable ports (no water within 10 cells): ${unreachable.join(", ")}`
    ).toHaveLength(0);
  });

  it("reports water/snap counts", () => {
    let onWater = 0;
    let snapped = 0;

    for (const port of ports) {
      const [col, row] = toCell(grid, port.lng, port.lat);
      if (isWater(grid, col, row)) {
        onWater++;
      } else {
        snapped++;
      }
    }

    console.log(
      `Port water coverage: ${onWater} on water, ${snapped} need snapping (${ports.length} total)`
    );
    expect(onWater + snapped).toBe(ports.length);
  });

  it("each lake has ports that map to valid water cells", () => {
    const lakes: GreatLakeName[] = [
      "Superior",
      "Michigan",
      "Huron",
      "Erie",
      "Ontario",
      "St. Clair",
    ];

    for (const lake of lakes) {
      const lakePorts = ports.filter((p) => p.lake === lake);
      expect(lakePorts.length, `No ports for Lake ${lake}`).toBeGreaterThan(0);

      const hasWaterPort = lakePorts.some((p) => {
        const nearest = findNearestWaterCell(grid, p.lng, p.lat, 5);
        return nearest !== null;
      });

      expect(
        hasWaterPort,
        `Lake ${lake} has no ports mapping to water cells`
      ).toBe(true);
    }
  });
});
