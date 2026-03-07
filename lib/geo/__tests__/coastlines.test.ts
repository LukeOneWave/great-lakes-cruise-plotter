import { describe, it, expect } from "vitest";
import { loadCoastlines } from "@/lib/geo/load-geo";
import { geoContains } from "d3-geo";
import fs from "fs";
import path from "path";

describe("Coastline data validation (DATA-01)", () => {
  const coastlines = loadCoastlines();

  it("returns a FeatureCollection with features", () => {
    expect(coastlines.type).toBe("FeatureCollection");
    expect(coastlines.features).toBeDefined();
    expect(coastlines.features.length).toBeGreaterThan(0);
  });

  it("has at least 5 features (one per Great Lake)", () => {
    expect(coastlines.features.length).toBeGreaterThanOrEqual(5);
  });

  it("TopoJSON source file is under 500KB", () => {
    const topoPath = path.resolve(__dirname, "../great-lakes.topo.json");
    const stats = fs.statSync(topoPath);
    const sizeKB = stats.size / 1024;
    expect(sizeKB).toBeLessThan(500);
  });

  it("features span the full Great Lakes bbox extent", () => {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const feature of coastlines.features) {
      const geom = feature.geometry;
      const coords = extractCoords(geom);
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }

    // Great Lakes span roughly -92 to -76 lng, 41 to 49 lat
    expect(minLng).toBeLessThan(-88);
    expect(maxLng).toBeGreaterThan(-78);
    expect(minLat).toBeLessThan(42);
    expect(maxLat).toBeGreaterThan(48);
  });

  describe("spot-check: known water points are contained", () => {
    const waterPoints: [string, [number, number]][] = [
      ["Lake Superior", [-87.5, 47.5]],
      ["Lake Michigan", [-86.5, 43.5]],
      ["Lake Huron", [-82.0, 44.5]],
      ["Lake Erie", [-81.0, 42.2]],
      ["Lake Ontario", [-77.5, 43.5]],
    ];

    for (const [name, point] of waterPoints) {
      it(`contains center of ${name} at [${point}]`, () => {
        const contained = coastlines.features.some((f) =>
          geoContains(f, point)
        );
        expect(contained, `${name} center should be inside a coastline feature`).toBe(true);
      });
    }
  });

  describe("spot-check: known land points are NOT contained", () => {
    const landPoints: [string, [number, number]][] = [
      ["Lansing Michigan (inland)", [-84.55, 42.73]],
      ["Midland Ontario", [-79.88, 44.75]],
    ];

    for (const [name, point] of landPoints) {
      it(`does NOT contain ${name} at [${point}]`, () => {
        const contained = coastlines.features.some((f) =>
          geoContains(f, point)
        );
        expect(contained, `${name} should NOT be inside any coastline feature`).toBe(false);
      });
    }
  });
});

/**
 * Recursively extract all [lng, lat] coordinate pairs from a GeoJSON geometry.
 */
function extractCoords(geom: any): number[][] {
  if (!geom || !geom.coordinates) return [];
  const type = geom.type;
  if (type === "Point") return [geom.coordinates];
  if (type === "MultiPoint" || type === "LineString") return geom.coordinates;
  if (type === "MultiLineString" || type === "Polygon")
    return geom.coordinates.flat();
  if (type === "MultiPolygon") return geom.coordinates.flat(2);
  return [];
}
