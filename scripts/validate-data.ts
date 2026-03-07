/**
 * validate-data.ts
 *
 * Standalone data validation script for Phase 1 assets.
 * Checks file existence, sizes, coastline data, grid integrity,
 * waterway connectivity, and port-to-grid mapping.
 *
 * Usage: npm run validate-data
 * Exit code 0 = all checks passed, 1 = failure
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
  const status = passed ? "PASS" : "FAIL";
  console.log(`  ${status}: ${name} (${detail})`);
}

// ---- 1. File existence and sizes ----

console.log("\n=== Phase 1 Data Validation ===\n");
console.log("-- File Checks --");

const dataFiles = [
  { path: "lib/geo/great-lakes.topo.json", maxKB: 500 },
  { path: "lib/grid/navigation-grid.json", maxKB: null },
  { path: "lib/ports/ports.json", maxKB: null },
  { path: "lib/geo/waterway-corridors.json", maxKB: null },
];

for (const file of dataFiles) {
  const fullPath = path.join(root, file.path);
  const exists = fs.existsSync(fullPath);
  if (!exists) {
    check(file.path, false, "FILE MISSING");
    continue;
  }
  const sizeKB = Math.round(fs.statSync(fullPath).size / 1024);
  if (file.maxKB && sizeKB > file.maxKB) {
    check(file.path, false, `${sizeKB}KB exceeds ${file.maxKB}KB limit`);
  } else {
    check(file.path, true, `${sizeKB}KB${file.maxKB ? ` < ${file.maxKB}KB` : ""}`);
  }
}

// ---- 2. TopoJSON / Coastlines ----

console.log("\n-- TopoJSON / Coastlines --");

try {
  const topoRaw = JSON.parse(
    fs.readFileSync(path.join(root, "lib/geo/great-lakes.topo.json"), "utf-8")
  );
  const topo = topoRaw as Topology;
  const objectKey = Object.keys(topo.objects)[0];
  const fc = feature(topo, topo.objects[objectKey]) as unknown as FeatureCollection;
  const featureCount = fc.features.length;
  check("TopoJSON features", featureCount >= 5, `${featureCount} features`);
} catch (e: any) {
  check("TopoJSON load", false, e.message);
}

// ---- 3. Navigation Grid ----

console.log("\n-- Navigation Grid --");

try {
  const gridRaw = JSON.parse(
    fs.readFileSync(path.join(root, "lib/grid/navigation-grid.json"), "utf-8")
  );
  const { width, height, bbox, cellSize, data } = gridRaw;
  check("Grid structure", width > 0 && height > 0 && data.length === width * height,
    `${width}x${height}`);

  const waterCount = data.filter((v: number) => v === 1).length;
  const waterPct = Math.round((waterCount / data.length) * 100);
  check("Grid water %", waterPct >= 15 && waterPct <= 50, `${waterPct}% water`);

  // Waterway checkpoints
  const toCell = (lng: number, lat: number): [number, number] => {
    const col = Math.floor((lng - bbox[0]) / cellSize);
    const row = Math.floor((bbox[3] - lat) / cellSize);
    return [col, row];
  };
  const isWater = (col: number, row: number): boolean => {
    if (col < 0 || col >= width || row < 0 || row >= height) return false;
    return data[row * width + col] === 1;
  };

  const waterways: { name: string; points: [number, number][] }[] = [
    { name: "Straits of Mackinac", points: [[-84.9, 45.78], [-84.7, 45.80], [-84.6, 45.82]] },
    { name: "St. Marys River", points: [[-84.35, 46.48], [-84.35, 46.43], [-84.35, 46.38]] },
    { name: "Detroit River / Lake St. Clair", points: [[-82.42, 42.95], [-82.7, 42.45], [-83.1, 42.3]] },
    { name: "Welland Canal", points: [[-79.22, 42.90], [-79.22, 43.05], [-79.22, 43.15]] },
    { name: "Upper St. Lawrence", points: [[-76.3, 44.2], [-76.0, 44.3], [-75.7, 44.4]] },
  ];

  let waterwaysPassed = 0;
  for (const ww of waterways) {
    const allWater = ww.points.every(([lng, lat]) => {
      const [c, r] = toCell(lng, lat);
      return isWater(c, r);
    });
    if (allWater) waterwaysPassed++;
  }
  check("Waterways", waterwaysPassed === 5, `${waterwaysPassed}/5 navigable`);

  // ---- 4. Ports ----

  console.log("\n-- Ports --");

  const portsRaw = JSON.parse(
    fs.readFileSync(path.join(root, "lib/ports/ports.json"), "utf-8")
  );
  const totalPorts = portsRaw.length;
  let onWater = 0;
  let snapped = 0;
  let unreachable = 0;

  for (const port of portsRaw) {
    const [col, row] = toCell(port.lng, port.lat);
    if (isWater(col, row)) {
      onWater++;
    } else {
      // Try to find nearest water cell within 10 cells (~20km at 0.02deg)
      let found = false;
      for (let r = 1; r <= 10 && !found; r++) {
        for (let dr = -r; dr <= r && !found; dr++) {
          for (let dc = -r; dc <= r && !found; dc++) {
            if (Math.abs(dr) !== r && Math.abs(dc) !== r) continue;
            if (isWater(col + dc, row + dr)) {
              found = true;
              snapped++;
            }
          }
        }
      }
      if (!found) unreachable++;
    }
  }

  check("Ports total", totalPorts >= 80, `${totalPorts} ports`);
  check("Ports on water", true, `${onWater} on water, ${snapped} snapped, ${unreachable} unreachable`);
  check("Ports reachable", unreachable === 0, unreachable === 0 ? "all reachable" : `${unreachable} unreachable`);

} catch (e: any) {
  check("Grid/Ports", false, e.message);
}

// ---- Summary ----

console.log("\n" + "=".repeat(40));
const failed = results.filter((r) => !r.passed);
if (failed.length === 0) {
  console.log("=== ALL CHECKS PASSED ===");
  process.exit(0);
} else {
  console.log(`=== ${failed.length} CHECK(S) FAILED ===`);
  for (const f of failed) {
    console.log(`  FAILED: ${f.name} -- ${f.detail}`);
  }
  process.exit(1);
}
