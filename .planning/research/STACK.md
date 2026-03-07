# Technology Stack

**Project:** Great Lakes Cruise Plotter
**Researched:** 2026-03-06

## Recommended Stack

### Core Framework (Already Scaffolded)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.1.6 | App framework | Already installed. App Router provides file-based routing, SSG for build-time grid generation. Overkill for a single-page app but already in place. | HIGH |
| React | 19.2.3 | UI rendering | Already installed. Manages port selection UI, route list, and map state. | HIGH |
| TypeScript | ^5 | Type safety | Already installed. Essential for complex geo data structures and pathfinding grid types. | HIGH |
| Tailwind CSS | ^4 | Styling | Already installed. Handles UI chrome (panels, buttons, inputs). Map SVG uses custom CSS/inline styles. | HIGH |

### Geographic Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| d3-geo | ^3.1.1 | Projections + path generation | Already installed. The standard for browser-based geographic projections. `geoPath()` converts GeoJSON to SVG path strings. Use `geoAlbers()` configured for Great Lakes region (not the US defaults). | HIGH |
| d3-geo-projection | ^4.0.0 | Extended projections | Already installed. Provides `geoAlbersUsa` and other options, though `geoAlbers` from d3-geo with custom parallels/center is the right choice for this project. | HIGH |
| topojson-client | ^3.1.0 | TopoJSON to GeoJSON conversion | **Add this.** Store coastline data as TopoJSON (80-85% smaller than GeoJSON). Use `feature()` at runtime to extract GeoJSON for d3-geo rendering. Stable at v3.1.0 (no updates needed, API is complete). | HIGH |
| @types/topojson-client | latest | TypeScript types for topojson-client | **Add this.** Required for TypeScript usage. | HIGH |

### Pathfinding

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom A* implementation | N/A | Water-only route finding | **Write from scratch.** PathFinding.js (v0.4.18, last updated 10 years ago) is unmaintained and not TypeScript-native. A* on a uniform grid is ~100 lines of code. Custom implementation gives full control over: water/land classification, diagonal movement costs, heuristic tuning for geographic coordinates, and TypedArray-backed grid for performance. | HIGH |

**Why NOT PathFinding.js:** Last published 10 years ago. No TypeScript support (only community @types). Generic game pathfinding library adds unnecessary abstraction for a simple grid problem. Writing A* from scratch is straightforward and lets you use `Float32Array`/`Uint8Array` for the navigation grid, which matters for performance at ~1km resolution across the Great Lakes (~500x300 grid).

**Why NOT EasyStar.js:** Asynchronous-only API is unnecessary complexity. Designed for game tick-based pathfinding, not one-shot geographic routing.

### Export Pipeline

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| jsPDF | ^4.2.0 | PDF generation | Already installed. Core PDF document creation. | HIGH |
| svg2pdf.js | ^2.5.0 | SVG-to-PDF conversion | **Add this.** Purpose-built to convert SVG DOM elements into jsPDF documents. Compatible with jsPDF v4.x. Preserves vector quality (no rasterization). Actively maintained by yWorks. | HIGH |
| Canvas API (native) | N/A | SVG-to-PNG conversion | **Use browser-native approach.** Serialize SVG to data URL, draw to `<canvas>`, export via `canvas.toDataURL('image/png')`. No library needed for this project's SVG complexity. ~20 lines of code. | MEDIUM |

**Why NOT html2canvas:** Designed for HTML screenshot capture, not SVG conversion. Adds 200KB+ to bundle for something the Canvas API does natively.

**Why NOT canvg:** Only needed for complex SVG features (filters, foreign objects). D3-generated SVG paths are simple enough for native Canvas rendering.

### Coastline Data

| Source | Resolution | Purpose | Why | Confidence |
|--------|-----------|---------|-----|------------|
| Natural Earth 10m Lakes | 1:10,000,000 | Great Lakes water polygons | Best balance of detail and file size. Includes all 5 Great Lakes with major islands (Manitoulin, Isle Royale, Apostle Islands). Public domain. Pre-converted GeoJSON available on GitHub. Convert to TopoJSON at build time for ~85% size reduction. | HIGH |
| Natural Earth 10m Coastline | 1:10,000,000 | Land boundaries | Same source, consistent styling. Use `ne_10m_lakes` for water bodies and `ne_10m_land` for surrounding terrain. | HIGH |

**Why NOT GSHHS/GSHHG:** Higher resolution (down to 1:1M) but dramatically larger files. The "full" resolution GSHHG for the Great Lakes region would be 10-50MB before simplification. Natural Earth 10m is pre-simplified to a sweet spot. GSHHG also requires Shapefile-to-GeoJSON conversion.

**Why NOT OpenStreetMap coastlines:** Extreme detail produces enormous files. Would need heavy simplification to meet the <2MB constraint, losing the advantage.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| d3-scale | ^4.0.2 | Color scales for depth gradients | Decorative depth shading on the map. `scaleLinear` for water depth color gradient. | HIGH |
| d3-array | ^3.2.4 | Data utilities | Distance calculations, array operations on port data. | MEDIUM |

### Testing (Already Scaffolded)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^4.0.18 | Test runner | Already installed. Fast, Vite-native. | HIGH |
| @testing-library/react | ^16.3.2 | Component testing | Already installed. Test port selection UI, route list interactions. | HIGH |
| @testing-library/jest-dom | ^6.9.1 | DOM assertions | Already installed. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Map rendering | d3-geo (SVG) | Leaflet / MapLibre GL | Project explicitly requires SVG output with nautical chart styling. Tile-based maps don't support custom SVG export or nautical aesthetic. |
| Map rendering | d3-geo (SVG) | Canvas rendering | SVG is required for vector export. Canvas would need separate export pipeline. SVG allows CSS-based nautical styling with patterns and filters. |
| Pathfinding | Custom A* | PathFinding.js | Unmaintained (10 years), no TS support, unnecessary abstraction for a simple grid. |
| Data format | TopoJSON (stored) -> GeoJSON (runtime) | GeoJSON only | TopoJSON is 80-85% smaller. Worth the ~2KB topojson-client dependency. |
| PDF export | svg2pdf.js + jsPDF | html2canvas + jsPDF | svg2pdf.js preserves vectors. html2canvas rasterizes, losing quality. |
| PNG export | Native Canvas API | canvg | Overkill for D3-generated SVG. Native approach is simpler and dependency-free. |
| Coastline data | Natural Earth 10m | GSHHS full resolution | File size constraint (<2MB). Natural Earth is pre-optimized. |
| Projection | geoAlbers (custom params) | geoMercator | Albers preserves area, better for mid-latitude regions. Mercator distorts at Great Lakes latitude. |
| Framework | Next.js (already installed) | Vite + React | Already scaffolded. Next.js SSG can pre-process grid at build time. |

## D3-Geo Projection Configuration

Use `geoAlbers()` with custom parameters for the Great Lakes region:

```typescript
import { geoAlbers, geoPath } from 'd3-geo';

const projection = geoAlbers()
  .center([0, 44.5])           // Center latitude for Great Lakes
  .rotate([84, 0])             // Center longitude (negated for rotation)
  .parallels([41, 48])         // Standard parallels spanning the lakes
  .fitExtent(
    [[margin, margin], [width - margin, height - margin]],
    greatlakesGeoJSON
  );

const pathGenerator = geoPath(projection);
```

**Why these parameters:**
- Center latitude 44.5 is the midpoint of the Great Lakes basin (41N to 49N)
- Rotation 84W centers on the longitudinal midpoint (~76W to ~92W)
- Parallels 41-48 minimize distortion across the full lake system
- `fitExtent` auto-scales to fill the SVG viewport

## Installation

```bash
# New dependencies to add
npm install topojson-client svg2pdf.js d3-scale

# New dev dependencies to add
npm install -D @types/topojson-client @types/d3-scale
```

## Build-Time Data Pipeline

The navigation grid and coastline data should be pre-processed at build time, not runtime:

1. **Source:** Natural Earth 10m Shapefiles -> convert to GeoJSON with `ogr2ogr` or use pre-converted GeoJSON from GitHub
2. **Optimize:** Convert GeoJSON to TopoJSON with `topojson-server` CLI (`geo2topo` + `toposimplify`)
3. **Grid:** Rasterize water polygons to a binary grid (~500x300 at 1km resolution) using a Node.js build script with d3-geo point-in-polygon checks
4. **Output:** TopoJSON file (<500KB) + binary grid file (<200KB) in `public/data/`

```bash
# Build-time tools (devDependencies only)
npm install -D topojson-server topojson-simplify shapefile
```

## Sources

- [d3-geo official documentation](https://d3js.org/d3-geo) - HIGH confidence
- [d3-geo projections](https://d3js.org/d3-geo/projection) - HIGH confidence
- [d3-geo-projection GitHub](https://github.com/d3/d3-geo-projection) - HIGH confidence
- [TopoJSON GitHub](https://github.com/topojson/topojson) - HIGH confidence
- [topojson-client npm](https://www.npmjs.com/package/topojson-client) - v3.1.0 confirmed
- [PathFinding.js npm](https://www.npmjs.com/package/pathfinding) - v0.4.18, last published 10 years ago
- [svg2pdf.js GitHub](https://github.com/yWorks/svg2pdf.js) - v2.5.0 confirmed, jsPDF v4.x compatible
- [Natural Earth 10m Physical Vectors](https://www.naturalearthdata.com/downloads/10m-physical-vectors/) - HIGH confidence
- [Natural Earth 10m Lakes](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-lakes/) - HIGH confidence
- [GSHHG Database](https://www.soest.hawaii.edu/pwessel/gshhg/) - Evaluated, not recommended for this project
- [Natural Earth GeoJSON on GitHub](https://github.com/martynafford/natural-earth-geojson) - Pre-converted GeoJSON available
