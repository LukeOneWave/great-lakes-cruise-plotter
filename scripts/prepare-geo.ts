/**
 * prepare-geo.ts
 *
 * Downloads Natural Earth 10m lake shapefiles, filters to the Great Lakes region,
 * merges waterway corridor overrides, and produces an optimized TopoJSON file.
 *
 * Output: lib/geo/great-lakes.topo.json (<500KB)
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as shapefile from "shapefile";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { quantize } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const OUT_FILE = join(ROOT, "lib", "geo", "great-lakes.topo.json");
const CORRIDORS_FILE = join(ROOT, "lib", "geo", "waterway-corridors.json");

const LAKES_URL = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_lakes.zip";
const LAKES_NA_URL =
  "https://naciscdn.org/naturalearth/10m/physical/ne_10m_lakes_north_america.zip";

// Great Lakes names to filter by
const GREAT_LAKE_NAMES = [
  "Lake Superior",
  "Lake Michigan",
  "Lake Huron",
  "Lake Erie",
  "Lake Ontario",
  "Lake St. Clair",
  "Lake Saint Clair", // Natural Earth uses full "Saint" spelling
];

// Bounding box for the Great Lakes region [minLng, minLat, maxLng, maxLat]
const BBOX: [number, number, number, number] = [-92.5, 41.0, -75.5, 49.5];

function featureInBbox(feature: Feature): boolean {
  if (!feature.geometry) return false;
  const coords = JSON.stringify(feature.geometry);
  // Quick heuristic: check if any coordinate pair falls within bbox
  const matches = coords.matchAll(
    /\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/g
  );
  for (const m of matches) {
    const lng = parseFloat(m[1]);
    const lat = parseFloat(m[2]);
    if (lng >= BBOX[0] && lng <= BBOX[2] && lat >= BBOX[1] && lat <= BBOX[3]) {
      return true;
    }
  }
  return false;
}

async function downloadAndExtract(url: string, name: string): Promise<void> {
  const zipPath = join(DATA_DIR, `${name}.zip`);
  const extractDir = join(DATA_DIR, name);

  // Check if already extracted
  const shpFile = join(extractDir, `${name}.shp`);
  if (existsSync(shpFile)) {
    console.log(`  [cached] ${name}.shp already exists`);
    return;
  }

  mkdirSync(extractDir, { recursive: true });

  if (!existsSync(zipPath)) {
    console.log(`  Downloading ${name}...`);
    execSync(`curl -sL -o "${zipPath}" "${url}"`, { stdio: "pipe" });
  }

  console.log(`  Extracting ${name}...`);
  execSync(`unzip -o -q "${zipPath}" -d "${extractDir}"`, { stdio: "pipe" });
}

async function readShapefile(dir: string, name: string): Promise<FeatureCollection> {
  const shpPath = join(dir, `${name}.shp`);
  if (!existsSync(shpPath)) {
    throw new Error(`Shapefile not found: ${shpPath}`);
  }
  const fc = await shapefile.read(shpPath) as FeatureCollection;
  return fc;
}

async function main(): Promise<void> {
  console.log("=== prepare-geo: Great Lakes TopoJSON Pipeline ===\n");

  // Step 1: Download shapefiles
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Step 1: Downloading Natural Earth data...");
  await downloadAndExtract(LAKES_URL, "ne_10m_lakes");
  await downloadAndExtract(LAKES_NA_URL, "ne_10m_lakes_north_america");

  // Step 2: Read shapefiles
  console.log("\nStep 2: Reading shapefiles...");
  const lakesFC = await readShapefile(
    join(DATA_DIR, "ne_10m_lakes"),
    "ne_10m_lakes"
  );
  const lakesNaFC = await readShapefile(
    join(DATA_DIR, "ne_10m_lakes_north_america"),
    "ne_10m_lakes_north_america"
  );

  console.log(`  ne_10m_lakes: ${lakesFC.features.length} features`);
  console.log(`  ne_10m_lakes_north_america: ${lakesNaFC.features.length} features`);

  // Step 3: Filter to Great Lakes region
  console.log("\nStep 3: Filtering to Great Lakes region...");
  const greatLakeFeatures: Feature<Geometry>[] = [];
  const foundLakeNames = new Set<string>();

  // Filter main lakes by name
  for (const f of lakesFC.features) {
    const name = f.properties?.name || f.properties?.NAME || "";
    if (GREAT_LAKE_NAMES.includes(name)) {
      greatLakeFeatures.push(f as Feature<Geometry>);
      foundLakeNames.add(name);
      console.log(`  [match] ${name}`);
    }
  }

  // Filter NA lakes by bbox (for smaller lakes, bays, etc.)
  let naCount = 0;
  for (const f of lakesNaFC.features) {
    const name = f.properties?.name || f.properties?.NAME || "";
    // Skip if already matched by name
    if (GREAT_LAKE_NAMES.includes(name)) continue;
    if (featureInBbox(f as Feature)) {
      greatLakeFeatures.push(f as Feature<Geometry>);
      naCount++;
      console.log(`  [bbox] ${name || "unnamed"}`);
    }
  }
  console.log(`  Found ${greatLakeFeatures.length} features (${foundLakeNames.size} named Great Lakes + ${naCount} from NA dataset)`);

  // Verify all lakes found
  for (const lake of GREAT_LAKE_NAMES) {
    if (!foundLakeNames.has(lake)) {
      // Also check if it's in NA dataset
      const naMatch = lakesNaFC.features.find(
        (f) => (f.properties?.name || f.properties?.NAME) === lake
      );
      if (naMatch) {
        greatLakeFeatures.push(naMatch as Feature<Geometry>);
        foundLakeNames.add(lake);
        console.log(`  [fallback from NA] ${lake}`);
      } else {
        console.warn(`  WARNING: ${lake} not found in either dataset!`);
      }
    }
  }

  // Step 4: Merge waterway corridors
  console.log("\nStep 4: Merging waterway corridors...");
  const corridorsRaw = JSON.parse(
    readFileSync(CORRIDORS_FILE, "utf-8")
  ) as FeatureCollection;
  for (const corridor of corridorsRaw.features) {
    greatLakeFeatures.push(corridor as Feature<Geometry>);
    console.log(`  [corridor] ${corridor.properties?.name}`);
  }

  const mergedFC: FeatureCollection = {
    type: "FeatureCollection",
    features: greatLakeFeatures,
  };

  // Step 5: Convert to TopoJSON
  console.log("\nStep 5: Converting to TopoJSON...");
  let topo = topology({ lakes: mergedFC }) as unknown as Topology;
  console.log(`  Objects: ${Object.keys(topo.objects).length}`);
  console.log(`  Arcs: ${topo.arcs.length}`);

  // Step 6: Simplify
  console.log("\nStep 6: Simplifying...");
  topo = presimplify(topo as any) as unknown as Topology;

  // Try increasing simplification until under 500KB
  const thresholds = [0.02, 0.03, 0.04, 0.05, 0.08, 0.10];
  let simplified: Topology | null = null;
  let finalSize = 0;

  for (const threshold of thresholds) {
    const q = quantile(topo as any, threshold);
    simplified = simplify(topo as any, q) as unknown as Topology;

    // Step 7: Quantize
    simplified = quantize(simplified as any, 1e5) as unknown as Topology;

    const json = JSON.stringify(simplified);
    finalSize = Buffer.byteLength(json, "utf-8");

    console.log(`  Threshold ${threshold}: ${(finalSize / 1024).toFixed(1)}KB`);

    if (finalSize < 512000) {
      break;
    }
  }

  if (!simplified) {
    throw new Error("Simplification failed to produce output");
  }

  // Step 8: Write output
  console.log("\nStep 7: Writing output...");
  const outputJson = JSON.stringify(simplified);
  writeFileSync(OUT_FILE, outputJson, "utf-8");

  // Step 9: Log stats
  const fileSizeKB = (Buffer.byteLength(outputJson, "utf-8") / 1024).toFixed(1);
  const objectKey = Object.keys(simplified.objects)[0];
  const obj = simplified.objects[objectKey] as any;
  const featureCount =
    obj.type === "GeometryCollection"
      ? obj.geometries.length
      : 1;

  console.log(`\n=== Output Statistics ===`);
  console.log(`  File: ${OUT_FILE}`);
  console.log(`  Size: ${fileSizeKB}KB`);
  console.log(`  Features: ${featureCount}`);
  console.log(`  Arcs: ${simplified.arcs.length}`);

  // Step 10: Validate
  console.log(`\n=== Validation ===`);

  if (finalSize >= 512000) {
    throw new Error(`FAIL: File size ${fileSizeKB}KB exceeds 500KB limit`);
  }
  console.log(`  PASS: File size ${fileSizeKB}KB < 500KB`);

  if (featureCount < 5) {
    throw new Error(`FAIL: Only ${featureCount} features, expected > 5`);
  }
  console.log(`  PASS: Feature count ${featureCount} > 5`);

  // Check lake names are represented
  const missingLakes = [];
  for (const lake of ["Superior", "Michigan", "Huron", "Erie", "Ontario"]) {
    if (!foundLakeNames.has(`Lake ${lake}`)) {
      missingLakes.push(lake);
    }
  }
  if (missingLakes.length > 0) {
    throw new Error(`FAIL: Missing lakes: ${missingLakes.join(", ")}`);
  }
  console.log(`  PASS: All 5 Great Lakes present`);

  if (!foundLakeNames.has("Lake St. Clair") && !foundLakeNames.has("Lake Saint Clair")) {
    console.warn(`  WARN: Lake St. Clair not found by name (covered by corridor polygons)`);
  } else {
    console.log(`  PASS: Lake St. Clair present`);
  }

  console.log(`\n=== prepare-geo complete ===`);
}

main().catch((err) => {
  console.error("ERROR:", err.message || err);
  process.exit(1);
});
