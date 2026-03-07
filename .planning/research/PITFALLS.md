# Domain Pitfalls

**Domain:** Marine route planning / GeoJSON map rendering (Great Lakes)
**Researched:** 2026-03-06

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Narrow Waterway Grid Resolution Starvation

**What goes wrong:** At ~1km grid resolution, narrow connecting waterways (St. Marys River, Detroit River, St. Clair River, Welland Canal, Straits of Mackinac) get zero navigable cells. The waterway is real but narrower than one grid cell, so the rasterizer marks all cells as land. A* then reports "no path found" between lakes, breaking the core promise of the app.

**Why it happens:** The Great Lakes connecting waterways range from ~300m (Welland Canal) to ~2km (Detroit River). A 1km grid cell must have its center point inside water to be marked navigable. Rivers that are 500m-1km wide often have no cell centers falling within them, especially at bends and narrow points.

**Consequences:** Routes cannot cross between lakes. The entire multi-lake routing feature is broken. Users see dead ends at lake boundaries.

**Prevention:**
- Use an "all_touched" rasterization strategy for waterway corridors: if any part of the cell overlaps water, mark it navigable
- Alternatively, manually define corridor overrides for known connecting waterways -- force specific grid cells to be navigable regardless of rasterization results
- Test every connecting waterway during grid generation with automated assertions: "path must exist from Lake Superior to Lake Ontario"
- Consider locally higher resolution (500m or 250m) grids for waterway corridors, or a dual-resolution approach

**Detection:** Automated integration tests that route between all five lakes. If any inter-lake route fails, the grid is broken.

**Phase relevance:** Must be solved in the navigation grid generation phase (Phase 2 per implementation plan). Cannot be deferred.

**Confidence:** HIGH -- this is a well-documented problem in maritime grid-based routing. The Detroit River is ~1.6km at its narrowest; St. Clair River ~500m; Welland Canal ~300m. At 1km resolution, these are borderline or sub-grid.

---

### Pitfall 2: GeoJSON Winding Order Rendering Artifacts

**What goes wrong:** GeoJSON polygons with incorrect winding order cause D3 to render the "fill" on the wrong side of the polygon boundary. Instead of filling the land area, D3 fills the entire sphere minus the land -- producing an inverted map where everything is land-colored except the actual coastline shape.

**Why it happens:** The RFC 7946 GeoJSON spec requires counterclockwise exterior rings and clockwise interior rings (holes). Natural Earth data and other sources sometimes ship with inconsistent or legacy winding order. D3's spherical rendering is sensitive to this: it interprets winding order to determine which side of a polygon is "inside."

**Consequences:** The map renders as a solid land-colored rectangle with tiny water cutouts, or individual features appear inverted. Visually broken. Hard to debug if you don't know what to look for, because the SVG paths are geometrically correct -- just filled wrong.

**Prevention:**
- Run all GeoJSON through `geojson-rewind` (npm package from Mapbox) during the build pipeline before any rendering
- Add a build-time validation step that checks winding order of all polygons
- Verify visually early: render a simple test map with just one lake before adding complexity

**Detection:** Visual inspection of the first rendered map. If land/water colors are inverted or the map looks "inside out," winding order is the cause.

**Phase relevance:** Must be handled when GeoJSON data is first processed (Phase 2: Map Data & Grid). Build-time fix, not runtime.

**Confidence:** HIGH -- this is the single most common D3 + GeoJSON issue, extensively documented by Mike Bostock and the Observable community.

**Sources:**
- [Mapbox geojson-rewind](https://github.com/mapbox/geojson-rewind)
- [Observable: Geo Rewind](https://observablehq.com/@fil/rewind)
- [macwright.com: GeoJSON deep dive](https://macwright.com/2015/03/23/geojson-second-bite)

---

### Pitfall 3: SVG Performance Collapse with High-Detail Coastlines

**What goes wrong:** Natural Earth 10m resolution GeoJSON for all five Great Lakes produces SVG paths with tens of thousands of coordinate points. The browser struggles to render, pan, or interact with the SVG. Initial render takes seconds. Export to PNG via canvas is slow or crashes. Memory usage spikes.

**Why it happens:** 10m Natural Earth data includes every bay, inlet, and peninsula at high fidelity. The Great Lakes have extremely complex coastlines (especially Lake Superior and Lake Huron's Georgian Bay). Each lake polygon can have 5,000-15,000+ coordinate pairs. Islands add thousands more. D3's `geoPath` faithfully converts all of them to SVG path `d` attributes.

**Consequences:** Sluggish map rendering, janky interactions, high memory use, export failures on lower-end devices. The 2MB bundle size constraint may be exceeded by GeoJSON data alone.

**Prevention:**
- Simplify GeoJSON at build time using `topojson-simplify` or `mapshaper` to reduce point counts while preserving shape
- Target 2,000-5,000 points per lake maximum for the rendered SVG
- Use TopoJSON format (significantly smaller than GeoJSON due to shared arcs)
- Truncate coordinate precision to 3-4 decimal places (~10m accuracy, sufficient for visualization)
- Profile SVG render time early: if initial render exceeds 500ms, simplify further
- Consider combining all land features into a single SVG path element (faster than separate paths per feature)

**Detection:** Measure `geoPath` rendering time and resulting SVG file size. If SVG exceeds 500KB or render time exceeds 300ms, simplification is needed.

**Phase relevance:** Must be addressed when processing GeoJSON data (Phase 2). Retroactively simplifying data after building the rendering pipeline is wasteful but possible.

**Confidence:** HIGH -- well-documented SVG performance cliff with geographic data. CSS-Tricks, Observable, and D3 community all cite this pattern.

**Sources:**
- [High Performance SVGs - CSS-Tricks](https://css-tricks.com/high-performance-svgs/)
- [Improving SVG Rendering Performance - CodePen](https://codepen.io/tigt/post/improving-svg-rendering-performance)
- [D3 d3-geo docs](https://d3js.org/d3-geo)

---

### Pitfall 4: A* Pathfinding Blocks the Main Thread

**What goes wrong:** Client-side A* on a ~1km grid covering all five Great Lakes (roughly 1200km x 600km = ~720,000 cells) freezes the browser UI during pathfinding. Long routes (e.g., Duluth to Montreal) may explore tens of thousands of nodes. The UI becomes unresponsive for 1-5 seconds.

**Why it happens:** JavaScript is single-threaded. A* is CPU-intensive. On a 720K cell grid, a cross-lake route may open 50,000+ nodes. Without yielding to the event loop, the browser freezes. The 2-second performance target is achievable but only if pathfinding doesn't compete with rendering.

**Consequences:** Users see a frozen UI when adding/reordering stops. No loading indicator is possible because the main thread is blocked. Perceived performance is terrible even if absolute time is acceptable.

**Prevention:**
- Run A* in a Web Worker from day one -- do not prototype on the main thread and "plan to move it later" (you won't, and by then it's entangled with state management)
- Use `Transferable` ArrayBuffers to pass the grid to the worker without serialization overhead
- Store the navigation grid as a flat `Uint8Array` (1 byte per cell: 0=land, 1=water) for efficient transfer and access
- Implement the open set with a binary heap, not an array (O(log n) vs O(n) for priority queue operations)
- Consider Jump Point Search (JPS) as an optimization -- it's specifically designed for uniform-cost grids and can be 10-50x faster than vanilla A*

**Detection:** Profile pathfinding for the longest possible route (Duluth, MN to Montreal, QC). If it exceeds 500ms, optimize. If it blocks the main thread at all, move to a Web Worker.

**Phase relevance:** Web Worker architecture must be decided in Phase 3 (Navigation Engine). Retrofitting Web Workers onto a main-thread implementation is painful due to the async boundary.

**Confidence:** HIGH -- pathfinding performance on large grids is extensively benchmarked. PathFinding.js and Grid Engine documentation both emphasize this.

**Sources:**
- [Grid Engine Pathfinding Performance](https://annoraaq.github.io/grid-engine/p/pathfinding-performance/index.html)
- [PathFinding.js](https://github.com/qiao/PathFinding.js)
- [Web Workers for heavy computation](https://jsmanifest.com/web-workers-offload-heavy-computation)

---

## Moderate Pitfalls

### Pitfall 5: jsPDF Cannot Handle Complex SVG Features

**What goes wrong:** jsPDF's SVG plugin silently drops SVG filters, gradients, CSS-based styling, patterns, clip-paths, and embedded fonts. The nautical chart styling (parchment texture, depth gradients, compass rose with gradients, paper texture filters) renders beautifully in the browser but exports as a broken or unstyled PDF.

**Why it happens:** jsPDF's SVG support is limited to basic paths, rectangles, circles, and inline fill/stroke attributes. It does not support: SVG `<filter>` elements, `<linearGradient>`/`<radialGradient>`, `<pattern>`, external CSS classes, `<clipPath>` with complex shapes, or embedded `<image>` elements reliably.

**Prevention:**
- Design the export pipeline as SVG -> Canvas (via `canvg` or native browser rendering) -> PNG -> jsPDF `addImage()`, not SVG -> jsPDF SVG plugin
- For SVG export: the raw SVG works fine since browsers handle all features
- For PNG export: render SVG to a canvas element, then `canvas.toDataURL()`
- For PDF export: use the PNG output from canvas and embed as an image in jsPDF
- Test export early with the actual nautical styling, not with a simplified test SVG
- Ensure all SVG assets (fonts, images) are inlined/embedded, not referenced externally, to avoid CORS tainted canvas issues

**Detection:** Export a styled SVG to PDF early in development. If gradients, filters, or textures disappear, you've hit this.

**Phase relevance:** Export implementation (Phase 5). But the SVG architecture should be designed with exportability in mind from Phase 3 (Map Rendering).

**Confidence:** HIGH -- jsPDF issue tracker is full of reports about unsupported SVG features. The SVG-to-canvas-to-image pipeline is the standard workaround.

**Sources:**
- [jsPDF SVG issues #2889](https://github.com/parallax/jsPDF/issues/2889)
- [jsPDF SVG issues #62](https://github.com/parallax/jsPDF/issues/62)

---

### Pitfall 6: Grid-to-Geographic Coordinate Mismatch

**What goes wrong:** The navigation grid uses row/column indices. Ports are stored as lat/lng. The map renders via D3's Albers projection (projected x/y coordinates). Three coordinate systems coexist, and conversions between them introduce off-by-one errors, axis flips (latitude is Y but decreases going down in grid space), and projection distortion mismatches.

**Why it happens:** Geographic coordinates are (longitude, latitude) -- note: lng first in GeoJSON, lat first in most human conventions. Grid cells are (row, col) where row 0 is typically the northernmost row. D3 projection output is (x, y) in pixel space. Converting between these three systems requires careful attention to axis ordering and origin conventions.

**Consequences:** Routes that appear correct on the grid plot in the wrong location on the map. Ports snap to wrong grid cells. Pathfinding finds a valid water route but it renders crossing land on the projected map (because the grid cell-to-projection mapping is slightly off).

**Prevention:**
- Define a single, canonical coordinate conversion module with functions: `latlngToGrid(lat, lng)`, `gridToLatlng(row, col)`, `latlngToProjection(lat, lng)`, `projectionToLatlng(x, y)`
- Write comprehensive unit tests for round-trip conversions: `latlngToGrid -> gridToLatlng` should return the original coordinates (within floating point tolerance)
- Use GeoJSON convention (longitude, latitude) consistently in data, and convert only at the UI boundary
- Be explicit about axis conventions in variable names: `gridRow`, `gridCol`, not `x`, `y`

**Detection:** Place a port at a known location (e.g., Chicago: 41.88N, 87.63W). Verify it appears at the correct position on the rendered map AND maps to the correct grid cell. If either is off, there's a coordinate mismatch.

**Phase relevance:** Must be nailed down in Phase 2 (Grid Generation) and verified in Phase 3 (Navigation Engine). Errors here cascade everywhere.

**Confidence:** HIGH -- coordinate system confusion is the #1 bug category in geographic applications. Every GIS tutorial warns about it.

---

### Pitfall 7: Missing or Misclassified Islands in Navigation Grid

**What goes wrong:** The navigation grid marks island cells as water because the GeoJSON source doesn't include the island, or the island is too small to register at the grid resolution. A* routes straight through Manitoulin Island, Isle Royale, or the Apostle Islands. The route visually crosses land on the map.

**Why it happens:** Natural Earth 10m data includes major islands but may omit smaller ones. Even included islands may be too small to occupy a full grid cell at 1km resolution. The GeoJSON coastline layer and the islands layer may be separate files that need to be merged.

**Consequences:** Routes that cross land are the single worst visual bug for this app. It directly contradicts the core promise ("routes never cross land").

**Prevention:**
- Verify Natural Earth data includes all significant Great Lakes islands: Manitoulin Island, Isle Royale, Apostle Islands, Drummond Island, Mackinac Island, Beaver Island, North/South Manitou Islands, Pelee Island, Wolfe Island, Thousand Islands (major ones)
- Use "all_touched" rasterization for islands: if any part of a cell touches land, mark it as land (opposite strategy from waterways -- conservative for obstacles)
- Overlay the rendered route on the detailed map and visually verify it doesn't cross any island
- Include islands as explicit "land" polygons in the grid generation, not just as "holes" in the water polygon

**Detection:** Automated test: route from Sault Ste. Marie to Marquette (passes near/through Apostle Islands area). Route from Tobermory to Manitowaning (crosses Manitoulin Island area). Visual overlay check.

**Phase relevance:** Grid generation (Phase 2). Must verify GeoJSON data completeness before building the grid.

**Confidence:** MEDIUM -- depends on the specific Natural Earth data files used. 10m data likely includes major islands but verification is required.

---

### Pitfall 8: Route Smoothing Creates Land-Crossing Curves

**What goes wrong:** A* produces a jagged grid-aligned path. Smoothing algorithms (Bezier curves, Catmull-Rom splines, Chaikin's algorithm) create aesthetically pleasing curves, but the smoothed curve may bulge into land cells that the original grid path avoided.

**Why it happens:** Smoothing algorithms interpolate between waypoints without awareness of the navigation grid. A path that follows a narrow channel hugging the coastline, when smoothed, will have control points that extend into land.

**Consequences:** The displayed route visually crosses land even though the underlying path was valid. Contradicts the "water-only" guarantee.

**Prevention:**
- Apply smoothing only to open-water segments, not near coastlines
- After smoothing, validate that all interpolated points fall on water cells in the grid
- Use conservative smoothing radius: limit curve deviation to max 1-2 grid cells from the original path
- Alternative: skip smoothing entirely and use polyline with rounded `stroke-linejoin` for visual softness
- If smoothing is required, use iterative smoothing that checks grid validity at each step

**Detection:** Render smoothed routes overlaid on the land/water grid. Zoom into coastline-adjacent segments and verify no curve crosses land.

**Phase relevance:** Route rendering (Phase 4). Design decision about smoothing should be made before implementing route display.

**Confidence:** MEDIUM -- this is a known issue in game pathfinding but the severity depends on how much smoothing is applied.

---

## Minor Pitfalls

### Pitfall 9: Lat/Lng vs Lng/Lat Coordinate Order Confusion

**What goes wrong:** GeoJSON uses [longitude, latitude] order. Most humans think [latitude, longitude]. Google Maps uses (lat, lng). D3 uses [lng, lat]. Mixing these up silently produces maps centered on the wrong location or ports plotted in the ocean.

**Prevention:**
- Use TypeScript types to enforce coordinate ordering: `type GeoCoord = [lng: number, lat: number]` vs `type LatLng = { lat: number; lng: number }`
- Never use bare `[number, number]` tuples for coordinates
- Document the convention at the top of every file that handles coordinates
- Validate port coordinates are within Great Lakes bounding box: lat 41-49, lng -92 to -76

**Detection:** If Chicago appears in the South Atlantic Ocean, coordinates are swapped.

**Phase relevance:** Phase 1 (Port Database) onward. Enforce from the start.

**Confidence:** HIGH -- universal GIS pitfall.

---

### Pitfall 10: SVG-to-PNG Export Tainted Canvas

**What goes wrong:** When converting SVG to PNG via canvas, if the SVG references any external resources (fonts via @font-face with URL, images via `<image href="...">`, CSS via `<link>`), the canvas becomes "tainted" and `toDataURL()`/`toBlob()` throws a security error. Export silently fails.

**Prevention:**
- Inline ALL resources in the SVG: embed fonts as base64 data URIs, embed images as base64, use inline `<style>` not external CSS
- Do not use `<image>` elements with external URLs in the SVG
- Use system fonts or self-hosted fonts loaded via inline `@font-face` with data URIs
- Test PNG export in Chrome, Firefox, and Safari (Safari is strictest about tainted canvas)

**Detection:** Try exporting to PNG. If it fails with "SecurityError: The operation is insecure" or produces a blank image, the canvas is tainted.

**Phase relevance:** Phase 5 (Export). But SVG construction in Phase 3 must be designed with inline resources in mind.

**Confidence:** HIGH -- well-documented browser security behavior.

**Sources:**
- [MDN: CORS-enabled images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)
- [Tainted Canvas explained](https://corsfix.com/blog/tainted-canvas)

---

### Pitfall 11: Albers Projection Distortion at Great Lakes Scale

**What goes wrong:** The D3 Albers equal-area conic projection requires two standard parallels. If these are poorly chosen for the Great Lakes extent (roughly 41N to 49N latitude, -92 to -76 longitude), features at the edges appear distorted -- shapes stretched or compressed compared to the center.

**Prevention:**
- Set standard parallels at roughly 1/6 and 5/6 of the latitude range: approximately 42.5N and 47.5N
- Set center at the geographic center of the Great Lakes: approximately (-84, 45)
- Use `d3.geoAlbers().parallels([42.5, 47.5]).center([-84, 45]).rotate([84, 0])` as a starting point
- Visually compare the rendered map against a known reference (Google Maps screenshot) to verify shapes look correct
- Alternative: `d3.geoConicConformal()` preserves shapes (angles) at the cost of area, which may look better for a nautical chart

**Detection:** Lake shapes look "squished" or "stretched" compared to real life. The upper lakes look too wide or too narrow relative to Lake Erie.

**Phase relevance:** Phase 3 (Map Rendering setup). Must be configured correctly before building any visual features on top.

**Confidence:** MEDIUM -- D3 Albers works well for the continental US; for the Great Lakes specifically, the standard parallels need to be tuned.

---

### Pitfall 12: Build-Time Grid Generation Makes Iteration Slow

**What goes wrong:** Rasterizing GeoJSON to a navigation grid at build time adds 10-30+ seconds to each build. During development, every code change triggers a rebuild, and waiting for grid regeneration kills iteration speed.

**Prevention:**
- Cache the generated grid artifact (e.g., `navigation-grid.bin`) and only regenerate when the source GeoJSON changes
- Use a content hash of the GeoJSON input to determine if regeneration is needed
- Store the grid as a pre-built static asset checked into the repo (it's deterministic from the GeoJSON input)
- Consider generating the grid as a separate npm script (`npm run generate-grid`) rather than as part of the Next.js build

**Detection:** Build times exceeding 15 seconds during development when no GeoJSON changes were made.

**Phase relevance:** Phase 2 (Grid Generation). Architecture decision about build pipeline.

**Confidence:** MEDIUM -- depends on implementation but grid generation from complex GeoJSON is inherently slow.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| GeoJSON data acquisition | Winding order (#2), Missing islands (#7) | Run geojson-rewind, verify island coverage |
| Navigation grid generation | Waterway starvation (#1), Grid-to-geo mismatch (#6), Build time (#12) | All-touched for waterways, corridor overrides, cached grid |
| Pathfinding engine | Main thread blocking (#4), Coordinate confusion (#9) | Web Worker from day one, typed coordinates |
| Map rendering (SVG) | SVG performance (#3), Projection distortion (#11) | Simplify GeoJSON, tune Albers parallels |
| Route display | Smoothing crosses land (#8) | Validate smoothed points against grid, or skip smoothing |
| Export (PNG/PDF) | jsPDF SVG limitations (#5), Tainted canvas (#10) | SVG->Canvas->Image pipeline, inline all resources |

## Sources

- [Mapbox geojson-rewind](https://github.com/mapbox/geojson-rewind)
- [Observable: Geo Rewind](https://observablehq.com/@fil/rewind)
- [macwright.com: More than you ever wanted to know about GeoJSON](https://macwright.com/2015/03/23/geojson-second-bite)
- [High Performance SVGs - CSS-Tricks](https://css-tricks.com/high-performance-svgs/)
- [Improving SVG Rendering Performance - CodePen](https://codepen.io/tigt/post/improving-svg-rendering-performance)
- [D3 d3-geo documentation](https://d3js.org/d3-geo)
- [Grid Engine Pathfinding Performance](https://annoraaq.github.io/grid-engine/p/pathfinding-performance/index.html)
- [PathFinding.js](https://github.com/qiao/PathFinding.js)
- [jsPDF SVG issues](https://github.com/parallax/jsPDF/issues/2889)
- [MDN: CORS-enabled images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)
- [Tainted Canvas explained](https://corsfix.com/blog/tainted-canvas)
- [Great Lakes Waterway - Wikipedia](https://en.wikipedia.org/wiki/Great_Lakes_Waterway)
- [Natural Earth Data](https://www.naturalearthdata.com/)
- [chrieke/geojson-invalid-geometry](https://github.com/chrieke/geojson-invalid-geometry)
