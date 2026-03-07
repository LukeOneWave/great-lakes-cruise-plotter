/**
 * generate-grid.ts
 *
 * Reads the TopoJSON output from prepare-geo and rasterizes it into a
 * navigation grid. Each cell is marked as water (1) or land (0).
 *
 * Output: lib/grid/navigation-grid.json
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Feature, Geometry } from "geojson";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const TOPO_FILE = resolve(ROOT, "lib", "geo", "great-lakes.topo.json");
const CORRIDORS_FILE = resolve(ROOT, "lib", "geo", "waterway-corridors.json");
const OUT_FILE = resolve(ROOT, "lib", "grid", "navigation-grid.json");

// Grid configuration
// Using 0.02 degrees (~2km) for performance. 0.01 would be ~1.4M cells and very slow.
const BBOX: [number, number, number, number] = [-92.5, 41.0, -75.5, 49.5];
const CELL_SIZE = 0.02;

// Waterway checkpoint coordinates for validation
const WATERWAY_CHECKS: Array<{ name: string; lng: number; lat: number }> = [
  { name: "Straits of Mackinac", lng: -84.8, lat: 45.8 },
  { name: "St. Marys River", lng: -84.35, lat: 46.5 },
  { name: "Detroit River area", lng: -83.1, lat: 42.3 },
  { name: "Welland Canal", lng: -79.22, lat: 43.0 },
  { name: "Upper St. Lawrence", lng: -76.0, lat: 44.3 },
];

function main(): void {
  console.log("=== generate-grid: Navigation Grid Generator ===\n");

  // Step 1: Load TopoJSON and convert to GeoJSON, plus raw corridor polygons
  console.log("Step 1: Loading coastline data...");
  const topoRaw = JSON.parse(readFileSync(TOPO_FILE, "utf-8")) as Topology;
  const objectKey = Object.keys(topoRaw.objects)[0];
  const geojson = feature(topoRaw, topoRaw.objects[objectKey]) as unknown as FeatureCollection;
  console.log(`  Loaded ${geojson.features.length} features from TopoJSON`);

  // Also load raw corridor polygons (TopoJSON simplification may distort small corridors)
  const corridorsRaw = JSON.parse(readFileSync(CORRIDORS_FILE, "utf-8")) as FeatureCollection;
  console.log(`  Loaded ${corridorsRaw.features.length} corridor overrides`);

  // Merge corridors into feature list (ensures corridors are tested at full resolution)
  const allFeatures = [...geojson.features, ...corridorsRaw.features] as Feature<Geometry>[];
  console.log(`  Total features for rasterization: ${allFeatures.length}`);

  // Step 2: Compute grid dimensions
  console.log("\nStep 2: Computing grid dimensions...");
  const width = Math.ceil((BBOX[2] - BBOX[0]) / CELL_SIZE);
  const height = Math.ceil((BBOX[3] - BBOX[1]) / CELL_SIZE);
  const totalCells = width * height;
  console.log(`  Grid: ${width} x ${height} = ${totalCells.toLocaleString()} cells`);
  console.log(`  Cell size: ${CELL_SIZE} degrees`);

  // Step 3: Pre-compute feature bounding boxes for fast rejection
  console.log("\nStep 3: Pre-computing feature bounds...");
  const featureBounds: Array<{
    feature: Feature<Geometry>;
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  }> = [];

  for (const f of allFeatures) {
    if (!f.geometry || f.geometry.type === "GeometryCollection") continue;
    const geom = f.geometry as Exclude<Geometry, { type: "GeometryCollection" }>;
    const coords = JSON.stringify(geom.coordinates);
    const numbers = coords.match(/-?\d+\.?\d*/g);
    if (!numbers) continue;

    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    // Parse coordinate pairs from the stringified coordinates
    const coordPairs = geom.coordinates;
    function extractBounds(arr: any): void {
      if (typeof arr[0] === "number" && typeof arr[1] === "number") {
        const lng = arr[0] as number;
        const lat = arr[1] as number;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(arr)) {
        for (const item of arr) {
          extractBounds(item);
        }
      }
    }
    extractBounds(coordPairs);

    if (minLng !== Infinity) {
      featureBounds.push({ feature: f, minLng, maxLng, minLat, maxLat });
    }
  }
  console.log(`  ${featureBounds.length} features with bounds`);

  // Step 4: Rasterize
  console.log("\nStep 4: Rasterizing grid...");
  const data = new Uint8Array(totalCells);
  let waterCells = 0;
  const startTime = Date.now();
  let lastProgress = 0;

  for (let row = 0; row < height; row++) {
    // Progress reporting every 10%
    const progress = Math.floor((row / height) * 100);
    if (progress >= lastProgress + 10) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${progress}% complete (${elapsed}s elapsed, ${waterCells} water cells so far)`);
      lastProgress = progress;
    }

    // lat goes from north (top) to south (bottom) in row-major order
    const lat = BBOX[3] - (row + 0.5) * CELL_SIZE;

    for (let col = 0; col < width; col++) {
      const lng = BBOX[0] + (col + 0.5) * CELL_SIZE;

      // Check if point is in any water feature
      let isWater = false;
      for (const fb of featureBounds) {
        // Quick bbox rejection
        if (lng < fb.minLng || lng > fb.maxLng || lat < fb.minLat || lat > fb.maxLat) {
          continue;
        }
        if (geoContains(fb.feature as any, [lng, lat])) {
          isWater = true;
          break;
        }
      }

      if (isWater) {
        data[row * width + col] = 1;
        waterCells++;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  100% complete (${elapsed}s)`);

  // Step 5: Build NavigationGrid object
  const grid = {
    width,
    height,
    bbox: BBOX,
    cellSize: CELL_SIZE,
    data: Array.from(data),
  };

  // Step 6: Write output
  console.log("\nStep 5: Writing output...");
  const json = JSON.stringify(grid);
  writeFileSync(OUT_FILE, json, "utf-8");

  const fileSizeKB = (Buffer.byteLength(json, "utf-8") / 1024).toFixed(1);
  const fileSizeMB = (Buffer.byteLength(json, "utf-8") / (1024 * 1024)).toFixed(2);
  const waterPct = ((waterCells / totalCells) * 100).toFixed(2);

  console.log(`\n=== Output Statistics ===`);
  console.log(`  File: ${OUT_FILE}`);
  console.log(`  Size: ${fileSizeKB}KB (${fileSizeMB}MB)`);
  console.log(`  Grid: ${width} x ${height}`);
  console.log(`  Total cells: ${totalCells.toLocaleString()}`);
  console.log(`  Water cells: ${waterCells.toLocaleString()} (${waterPct}%)`);
  console.log(`  Land cells: ${(totalCells - waterCells).toLocaleString()}`);

  // Step 7: Validate waterway checkpoints
  console.log(`\n=== Waterway Validation ===`);
  let allPassed = true;
  for (const check of WATERWAY_CHECKS) {
    const col = Math.floor((check.lng - BBOX[0]) / CELL_SIZE);
    const row = Math.floor((BBOX[3] - check.lat) / CELL_SIZE);
    const cellValue = data[row * width + col];
    if (cellValue === 1) {
      console.log(`  PASS: ${check.name} [${check.lng}, ${check.lat}] -> water`);
    } else {
      console.error(`  ERROR: ${check.name} [${check.lng}, ${check.lat}] -> LAND (expected water)`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error("\n  Some waterway checks failed! Grid may have connectivity issues.");
  }

  console.log(`\n=== generate-grid complete ===`);
}

main();
