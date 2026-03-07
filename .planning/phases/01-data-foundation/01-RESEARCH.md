# Phase 1: Data Foundation - Research

**Researched:** 2026-03-06
**Domain:** Geographic data processing (GeoJSON/TopoJSON), navigation grid generation, port database curation
**Confidence:** HIGH

## Summary

Phase 1 requires building three data assets that every downstream phase depends on: (1) optimized TopoJSON coastline data for all 5 Great Lakes with islands, (2) a navigation grid that marks water vs. land cells for A* pathfinding including connecting waterways, and (3) a curated port database with ~80-100 entries.

The existing project already has `d3-geo` and `d3-geo-projection` installed. The data pipeline is a build-time process: download Natural Earth shapefiles, extract/clip Great Lakes features, convert GeoJSON to TopoJSON with simplification, and generate a binary navigation grid. The highest-risk item is ensuring narrow connecting waterways (especially Welland Canal at ~300m width) remain navigable in the grid -- this requires manual corridor overrides since Natural Earth data does not include all these channels as navigable polygons.

**Primary recommendation:** Use Natural Earth 10m lakes + supplemental North America lakes as the coastline source. Process with the `topojson` CLI toolchain (geo2topo, toposimplify, topoquantize) to get under 500KB. Build the navigation grid as a separate build-time script using point-in-polygon tests against the water polygons, with hardcoded corridor overrides for narrow waterways. Curate the port database manually from Wikipedia's "List of ports on the Great Lakes" plus marina directories.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | User sees high-detail Great Lakes coastlines for all 5 lakes with major islands (via TopoJSON) | Natural Earth 10m lakes + ne_10m_lakes_north_america supplemental data provides coastlines and islands. TopoJSON toolchain (geo2topo + toposimplify + topoquantize) achieves 80-85% size reduction. Target under 500KB. |
| DATA-02 | User can route through connecting waterways (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, upper St. Lawrence) | Natural Earth rivers data provides centerlines but NOT navigable polygons for all waterways. Welland Canal (~300m) and some rivers may not appear as water in the lake polygons. Solution: manually define corridor overrides as GeoJSON polygons that get merged with lake water data before grid rasterization. |
| DATA-03 | User can search and select from ~80-100 curated Great Lakes ports | No existing structured dataset with coordinates found. Manual curation from Wikipedia "List of ports on the Great Lakes", NOAA charts, and marina directories. Static JSON file with fields: id, name, lat, lng, lake, type, description. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| topojson-server | ^3.0.1 | GeoJSON to TopoJSON conversion (geo2topo CLI) | Official TopoJSON toolchain by Mike Bostock |
| topojson-simplify | ^3.0.3 | Geometry simplification preserving topology (toposimplify CLI) | Only tool that simplifies while preserving shared boundaries |
| topojson-client | ^3.1.0 | TopoJSON to GeoJSON at runtime (feature/mesh extraction) | Standard companion; already needed for d3 rendering in Phase 2 |
| d3-geo | ^3.1.1 | Geographic projection and containment tests (geoContains) | Already installed; used for point-in-polygon during grid generation |
| shapefile | ^0.6.6 | Parse Natural Earth .shp files in Node.js | Standard library for reading ESRI shapefiles in JS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @turf/boolean-point-in-polygon | ^7.1.0 | Fast point-in-polygon test for grid rasterization | If d3-geo geoContains is too slow for grid generation |
| @turf/bbox | ^7.1.0 | Bounding box computation for clipping | Utility for clipping Natural Earth data to Great Lakes extent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| topojson CLI pipeline | mapshaper | Mapshaper is more powerful but heavier; topojson CLI is simpler for this use case |
| Manual port curation | NOAA ENC data | ENC data is comprehensive but complex to parse; manual curation gives control over port selection |
| d3-geo geoContains | @turf/boolean-point-in-polygon | Turf is faster for bulk operations; d3-geo geoContains is sufficient and already installed |

### Dev Dependencies (build scripts only)
```bash
npm install -D topojson-server topojson-simplify topojson-client shapefile @types/topojson-specification
```

### Runtime Dependencies
```bash
npm install topojson-client
```

Note: `topojson-server`, `topojson-simplify`, and `shapefile` are build-time only (used in data processing scripts). Only `topojson-client` is needed at runtime for converting TopoJSON back to GeoJSON for rendering.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  prepare-geo.ts          # Downloads and processes Natural Earth data
  generate-grid.ts        # Rasterizes water polygons into navigation grid
  validate-data.ts        # Verifies all data assets are correct
lib/
  geo/
    great-lakes.topo.json # Optimized TopoJSON coastline data (<500KB)
    waterway-corridors.json # Manually defined waterway corridor polygons
    load-geo.ts           # Runtime loader: TopoJSON -> GeoJSON via topojson-client
    types.ts              # TypeScript interfaces for geo data
  grid/
    navigation-grid.json  # Pre-computed water/land grid (~1km resolution)
    grid.ts               # Grid loader and cell lookup utilities
    types.ts              # Grid type definitions
  ports/
    ports.json            # Curated port database (~80-100 entries)
    ports.ts              # Port search, filter, and lookup functions
    types.ts              # Port type definitions
```

### Pattern 1: Build-Time Data Pipeline
**What:** Process raw geographic data into optimized assets at build time, not runtime.
**When to use:** Always -- raw Natural Earth data is ~50MB; processed assets should be <2MB total.
**Pipeline:**
```
Natural Earth .shp files
  -> shapefile (parse)
  -> filter/clip to Great Lakes bbox [-92.5, 41.0, -75.5, 49.5]
  -> merge waterway corridor overrides
  -> geo2topo (convert to TopoJSON)
  -> toposimplify -p 1e-7 (simplify geometry)
  -> topoquantize 1e5 (quantize coordinates)
  -> great-lakes.topo.json (<500KB)
```

### Pattern 2: Navigation Grid as Typed Array
**What:** Store the navigation grid as a flat Uint8Array with row-major ordering, not nested arrays.
**When to use:** For the ~1km resolution grid covering the Great Lakes bounding box.
**Why:** A flat typed array is ~10x more compact than nested JS arrays and supports fast index-based lookup.
**Example:**
```typescript
interface NavigationGrid {
  width: number;       // columns (longitude cells)
  height: number;      // rows (latitude cells)
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  cellSize: number;    // degrees per cell (~0.01 for ~1km at this latitude)
  data: number[];      // 0 = land, 1 = water, row-major order
}

// Convert lat/lng to grid cell
function toCell(grid: NavigationGrid, lng: number, lat: number): [number, number] {
  const col = Math.floor((lng - grid.bbox[0]) / grid.cellSize);
  const row = Math.floor((grid.bbox[3] - lat) / grid.cellSize); // top-down
  return [col, row];
}

// Check if cell is water
function isWater(grid: NavigationGrid, col: number, row: number): boolean {
  if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) return false;
  return grid.data[row * grid.width + col] === 1;
}
```

### Pattern 3: Waterway Corridor Overrides
**What:** Manually define rectangular or polygonal corridors for narrow waterways that disappear at grid resolution.
**When to use:** For Welland Canal, St. Marys River narrows, Detroit River, and any channel under ~2km wide.
**Example:**
```typescript
// waterway-corridors.json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Welland Canal", "type": "canal" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-79.25, 42.87], [-79.20, 42.87],
          [-79.20, 43.22], [-79.25, 43.22],
          [-79.25, 42.87]
        ]]
      }
    }
    // ... more corridors
  ]
}
```
These polygons get merged with lake water polygons BEFORE grid rasterization, ensuring the grid marks these cells as navigable.

### Pattern 4: Port Database with Search Index
**What:** Static JSON with fuzzy search support via simple substring/prefix matching.
**When to use:** For the port search feature (DATA-03).
**Example:**
```typescript
export interface Port {
  id: string;          // e.g., "chicago-il"
  name: string;        // e.g., "Chicago, IL"
  lat: number;
  lng: number;
  lake: 'Superior' | 'Michigan' | 'Huron' | 'Erie' | 'Ontario' | 'St. Clair';
  type: 'city' | 'marina' | 'island' | 'landmark';
  description?: string;
}

export function searchPorts(query: string): Port[] {
  const q = query.toLowerCase();
  return getAllPorts().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.lake.toLowerCase().includes(q)
  );
}
```

### Anti-Patterns to Avoid
- **Loading raw GeoJSON at runtime:** GeoJSON files are 5-10x larger than TopoJSON. Always convert to TopoJSON at build time and use `topojson-client` to extract features at runtime.
- **Nested JS arrays for grid:** Using `boolean[][]` wastes memory and is slow. Use a flat typed array with index math.
- **Fetching Natural Earth data at runtime:** These are 50MB+ shapefiles. Download and process at build time only.
- **Hardcoding waterway corridors in the grid generator:** Keep corridor definitions in a separate JSON file so they can be visualized, validated, and adjusted independently.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GeoJSON to TopoJSON | Custom topology extraction | topojson-server (geo2topo) | Topology detection requires computational geometry; shared arc deduplication is non-trivial |
| Geometry simplification | Visvalingam or Douglas-Peucker from scratch | topojson-simplify | Must preserve topology (shared boundaries); naive simplification creates gaps between adjacent polygons |
| Point-in-polygon test | Ray casting algorithm | d3-geo geoContains or @turf/boolean-point-in-polygon | Handles edge cases (antimeridian, poles, degenerate polygons) correctly |
| Shapefile parsing | Binary format reader | shapefile npm package | SHP format has multiple companion files (.dbf, .shx, .prj) with complex binary layouts |
| Coordinate quantization | Rounding coordinates | topoquantize | Delta-encoding after quantization gives much better compression than simple rounding |

**Key insight:** Geographic data processing has many subtle edge cases (coordinate winding order, multipolygon holes, antimeridian wrapping, projection distortion). Using established libraries prevents days of debugging.

## Common Pitfalls

### Pitfall 1: Welland Canal Disappears at Grid Resolution
**What goes wrong:** At ~1km grid resolution, the Welland Canal (~300m wide) has no water cells, making Lake Erie to Lake Ontario routes impossible.
**Why it happens:** The canal is narrower than a single grid cell.
**How to avoid:** Define waterway corridor overrides (wider-than-reality rectangles) that force grid cells to be marked as water. The corridors are only for pathfinding, not visual display.
**Warning signs:** A* pathfinding returns no route between Lake Erie and Lake Ontario ports.

### Pitfall 2: Wrong Winding Order in GeoJSON
**What goes wrong:** Polygons render as inverted (entire world is "water" except the lakes).
**Why it happens:** GeoJSON spec requires outer rings to be counterclockwise, holes clockwise. Natural Earth data sometimes violates this.
**How to avoid:** Use `turf/rewind` or verify winding order in the processing script. The `topojson` toolchain handles this during conversion.
**Warning signs:** Point-in-polygon tests return opposite results; coastlines look correct but grid is inverted.

### Pitfall 3: Missing Islands in Simplified TopoJSON
**What goes wrong:** Major islands (Manitoulin, Isle Royale) disappear after aggressive simplification.
**Why it happens:** Small-area features are removed by area-based simplification (Visvalingam).
**How to avoid:** Use a conservative simplification threshold. Test that island features survive simplification. A threshold of `1e-7` to `1e-8` preserves major islands while still achieving significant reduction.
**Warning signs:** Comparing feature counts before and after simplification shows dramatic drops.

### Pitfall 4: Grid Resolution Too Coarse or Too Fine
**What goes wrong:** Too coarse (5km): routes look blocky, miss narrow passages. Too fine (100m): grid is enormous, loads slowly.
**Why it happens:** Not considering the tradeoff between accuracy and performance.
**How to avoid:** Target ~1km resolution. The bounding box [-92.5, 41.0, -75.5, 49.5] spans ~17deg longitude x 8.5deg latitude. At 0.01 degree cells (approximately 1km): 1700 x 850 = 1,445,000 cells. As Uint8, that is ~1.4MB uncompressed, ~200KB gzipped. This meets the "loads in under 1 second" requirement.
**Warning signs:** Grid JSON file exceeds 5MB or A* takes more than 2 seconds.

### Pitfall 5: Port Coordinates Not on Water
**What goes wrong:** A port's lat/lng falls on land in the navigation grid, making it unreachable by the pathfinder.
**Why it happens:** Port coordinates from databases point to city centers, not waterfront.
**How to avoid:** For each port, verify its coordinates fall on a water cell in the grid. If not, snap to the nearest water cell. Include a validation step in the data pipeline.
**Warning signs:** A* pathfinding fails to find routes to specific ports.

### Pitfall 6: Lake St. Clair Omitted
**What goes wrong:** Routes between Lake Huron and Lake Erie fail because Lake St. Clair (between them) is not included.
**Why it happens:** Lake St. Clair is often not listed among "the five Great Lakes" but is essential for connectivity.
**How to avoid:** Explicitly include Lake St. Clair in the water polygons. Natural Earth 10m lakes includes it, but verify after filtering.
**Warning signs:** No water path exists between Lake Huron and Lake Erie ports.

## Code Examples

### Loading and Filtering Natural Earth Data (Build Script)
```typescript
// scripts/prepare-geo.ts
import { read } from 'shapefile';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { quantize } from 'topojson-client';
import { writeFileSync } from 'fs';

const BBOX = [-92.5, 41.0, -75.5, 49.5]; // Great Lakes bounding box

async function main() {
  // 1. Read Natural Earth lakes shapefile
  const lakes = await read('data/ne_10m_lakes.shp');
  const lakesNA = await read('data/ne_10m_lakes_north_america.shp');

  // 2. Filter to Great Lakes region features
  const greatLakesNames = [
    'Lake Superior', 'Lake Michigan', 'Lake Huron',
    'Lake Erie', 'Lake Ontario', 'Lake St. Clair'
  ];

  const features = [...lakes.features, ...lakesNA.features]
    .filter(f => {
      const name = f.properties?.name || '';
      return greatLakesNames.some(gl => name.includes(gl)) ||
             isWithinBBox(f, BBOX);
    });

  // 3. Create GeoJSON FeatureCollection
  const geojson = { type: 'FeatureCollection', features };

  // 4. Convert to TopoJSON
  let topo = topology({ lakes: geojson });

  // 5. Simplify
  topo = presimplify(topo);
  const minWeight = quantile(topo, 0.02); // keep 98% of detail
  topo = simplify(topo, minWeight);

  // 6. Quantize
  topo = quantize(topo, 1e5);

  // 7. Write output
  writeFileSync('lib/geo/great-lakes.topo.json', JSON.stringify(topo));
}
```

### Runtime TopoJSON Loading
```typescript
// lib/geo/load-geo.ts
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import topoData from './great-lakes.topo.json';

export function loadCoastlines() {
  const topo = topoData as unknown as Topology;
  return feature(topo, topo.objects.lakes);
}
```

### Grid Rasterization (Build Script)
```typescript
// scripts/generate-grid.ts
import { geoContains } from 'd3-geo';
import type { FeatureCollection } from 'geojson';

interface GridConfig {
  bbox: [number, number, number, number];
  cellSize: number; // degrees
}

function rasterize(water: FeatureCollection, config: GridConfig) {
  const [minLng, minLat, maxLng, maxLat] = config.bbox;
  const width = Math.ceil((maxLng - minLng) / config.cellSize);
  const height = Math.ceil((maxLat - minLat) / config.cellSize);
  const data = new Uint8Array(width * height);

  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row + 0.5) * config.cellSize;
    for (let col = 0; col < width; col++) {
      const lng = minLng + (col + 0.5) * config.cellSize;
      // Check if cell center is inside any water polygon
      for (const feat of water.features) {
        if (geoContains(feat, [lng, lat])) {
          data[row * width + col] = 1;
          break;
        }
      }
    }
  }

  return { width, height, bbox: config.bbox, cellSize: config.cellSize, data: Array.from(data) };
}
```

### Port Data Structure
```typescript
// lib/ports/types.ts
export interface Port {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lake: 'Superior' | 'Michigan' | 'Huron' | 'Erie' | 'Ontario' | 'St. Clair';
  type: 'city' | 'marina' | 'island' | 'landmark';
  state?: string;    // US state or Canadian province
  country: 'US' | 'CA';
  description?: string;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GeoJSON for web maps | TopoJSON for web maps | 2013+ (stable) | 80-85% file size reduction via shared arc topology |
| Shapefile-only distribution | GeoJSON on GitHub (Natural Earth) | 2016+ | Direct access without conversion; but shapefiles still have more features |
| topojson v1 (single package) | topojson v3 (modular: server/client/simplify) | 2017 | Separate build-time and runtime dependencies |
| Fetch tiles from server | Static pre-processed data assets | N/A (project choice) | No server dependency, works offline, predictable performance |

**Deprecated/outdated:**
- `topojson` v1/v2 monolithic package: Use modular v3 packages (`topojson-server`, `topojson-client`, `topojson-simplify`)
- PathFinding.js: Unmaintained for 10 years (per STATE.md). Custom A* is the right call for Phase 3.

## Open Questions

1. **Exact Natural Earth feature names for Great Lakes**
   - What we know: ne_10m_lakes.shp contains "Lake Superior", "Lake Michigan", etc. as named features
   - What's unclear: Exact property names and whether Lake St. Clair is in the main dataset or supplemental North America dataset
   - Recommendation: Download both datasets and inspect properties during build script development. Log all feature names to find the right filter.

2. **Connecting waterway polygon coverage**
   - What we know: Natural Earth 10m lakes includes the major lakes as polygons. Rivers dataset provides centerlines only (not navigable-width polygons). Welland Canal is likely NOT included.
   - What's unclear: Which waterways appear as water polygons vs. which need manual corridor overrides
   - Recommendation: Build the pipeline with corridor override support from day one. Test each waterway individually. Start with 5 known waterways: St. Marys River, Straits of Mackinac, Detroit/St. Clair River system, Welland Canal, upper St. Lawrence.

3. **Optimal simplification threshold**
   - What we know: topojson-simplify uses Visvalingam's algorithm. Too aggressive removes islands.
   - What's unclear: Exact threshold to hit <500KB while keeping all major islands
   - Recommendation: Start with `quantile(topo, 0.02)` (keep 98%). Adjust iteratively. Validate island count after each run.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | TopoJSON contains all 5 Great Lakes + major islands, file < 500KB | unit | `npx vitest run lib/geo/__tests__/coastlines.test.ts -x` | No - Wave 0 |
| DATA-02 | Navigation grid has water cells in all connecting waterways | unit | `npx vitest run lib/grid/__tests__/waterways.test.ts -x` | No - Wave 0 |
| DATA-02 | Grid loads in under 1 second | unit | `npx vitest run lib/grid/__tests__/performance.test.ts -x` | No - Wave 0 |
| DATA-03 | Port database has 80-100 entries with valid coordinates | unit | `npx vitest run lib/ports/__tests__/ports.test.ts -x` | No - Wave 0 |
| DATA-03 | Port search returns relevant results | unit | `npx vitest run lib/ports/__tests__/search.test.ts -x` | No - Wave 0 |
| DATA-03 | All port coordinates fall on water cells in grid | integration | `npx vitest run lib/ports/__tests__/port-grid.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `lib/geo/__tests__/coastlines.test.ts` -- covers DATA-01 (coastline completeness, file size)
- [ ] `lib/grid/__tests__/waterways.test.ts` -- covers DATA-02 (waterway navigability)
- [ ] `lib/grid/__tests__/performance.test.ts` -- covers DATA-02 (grid load time)
- [ ] `lib/ports/__tests__/ports.test.ts` -- covers DATA-03 (port data completeness)
- [ ] `lib/ports/__tests__/search.test.ts` -- covers DATA-03 (search functionality)
- [ ] `lib/ports/__tests__/port-grid.test.ts` -- covers DATA-01/02/03 integration (ports on water)

## Sources

### Primary (HIGH confidence)
- [Natural Earth 10m Lakes](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/) - Dataset description, features, download
- [Natural Earth 10m Rivers](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/) - Rivers and lake centerlines, supplemental data
- [topojson-server GitHub](https://github.com/topojson/topojson-server) - geo2topo API and CLI usage
- [topojson-simplify GitHub](https://github.com/topojson/topojson-simplify) - presimplify, simplify, quantile API
- [topojson-client npm](https://www.npmjs.com/package/topojson-client) - feature extraction, mesh generation
- [d3-geo official docs](https://d3js.org/d3-geo) - geoPath, geoContains, geoAlbers projection
- [Natural Earth GeoJSON GitHub](https://github.com/nvkelso/natural-earth-vector) - Raw data files

### Secondary (MEDIUM confidence)
- [Wikipedia: List of ports on the Great Lakes](https://en.wikipedia.org/wiki/List_of_ports_on_the_Great_Lakes) - Port names by lake, partial coordinates
- [Command-Line Cartography Part 3 (Bostock)](https://medium.com/@mbostock/command-line-cartography-part-3-1158e4c55a1e) - TopoJSON pipeline workflow
- [Turf.js booleanPointInPolygon](https://turfjs.org/docs/api/booleanPointInPolygon) - Alternative point-in-polygon for grid rasterization

### Tertiary (LOW confidence)
- [rowanwins/vector-to-grid](https://github.com/rowanwins/vector-to-grid) - Abandoned (2020), but demonstrates approach. Do not use.
- [Great Lakes Group Ports](https://thegreatlakesgroup.com/ports) - Commercial port listings, limited coordinate data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - topojson and d3-geo are mature, well-documented, and the canonical choice for this workflow
- Architecture: HIGH - build-time data pipeline is the established pattern; grid rasterization approach is well-understood
- Pitfalls: HIGH - waterway corridor issue documented in project STATE.md; other pitfalls from established GIS practice
- Port database: MEDIUM - no single authoritative source; manual curation required

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable domain, tools rarely change)
