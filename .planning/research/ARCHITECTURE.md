# Architecture Patterns

**Domain:** Client-side marine route planning / cruise map visualization
**Researched:** 2026-03-06

## Recommended Architecture

```
+-------------------------------------------------------------+
|                     Next.js App Shell                        |
|  (App Router, layout, page composition, SSR/SSG boundary)   |
+-----+------------------+------------------+-----------------+
      |                  |                  |
      v                  v                  v
+-----------+    +---------------+    +-----------+
| Destination|   | Map Renderer  |    | Trip      |
| Picker     |   | (SVG + D3)    |    | Summary   |
| Component  |   |               |    | Panel     |
+-----+------+   +-------+-------+    +-----+-----+
      |                  |                  |
      |    +-------------+                  |
      v    v                                v
+--------------------+            +-----------------+
| Route Planning     |            | Export Engine   |
| State Manager      |            | (SVG/PNG/PDF)  |
| (React Context or  |            +-----------------+
|  useReducer)       |
+--------+-----------+
         |
         v
+--------------------+         +---------------------+
| Navigation Engine  |<------->| Navigation Grid     |
| (A* Pathfinder)    |         | (Binary water mask) |
+--------------------+         +---------------------+
         ^                               ^
         |                               |
+--------+-----------+         +---------+-----------+
| Port Database      |         | GeoJSON Data        |
| (Static JSON)      |         | Pipeline            |
+--------------------+         | (Build-time)        |
                               +---------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | I/O |
|-----------|---------------|-------------------|-----|
| **GeoJSON Data Pipeline** | Fetches, clips, and processes Natural Earth coastline data into app-ready GeoJSON at build time | Navigation Grid Generator (downstream) | IN: Raw Natural Earth shapefiles/GeoJSON; OUT: Clipped, filtered `great-lakes.json` (<2MB) |
| **Navigation Grid** | Binary 2D array where 0=water (walkable) and 1=land (blocked), generated at build time from GeoJSON water polygons | Navigation Engine (consumed by), GeoJSON Pipeline (produced by) | IN: Water polygon GeoJSON; OUT: `Uint8Array` grid + metadata (bounds, resolution, dimensions) |
| **Navigation Engine** | A* pathfinding on the binary grid; accepts start/end grid coordinates, returns waypoint arrays | Route Planning State (called by), Navigation Grid (reads) | IN: [lat,lng] pairs for origin/destination; OUT: Array of [lat,lng] waypoints |
| **Port Database** | Static JSON of ~80-100 curated Great Lakes ports with coordinates, lake, type | Destination Picker (queried by), Navigation Engine (coordinates fed to) | IN: Search query string; OUT: Filtered port list |
| **Destination Picker** | Search, select, reorder multi-stop port itinerary | Route Planning State (updates) | IN: User input; OUT: Ordered list of Port objects |
| **Route Planning State** | Central state: selected ports, computed routes, speed setting, distances | All UI components (read), Navigation Engine (triggers) | Holds: ports[], routes[], speed, distances |
| **Map Renderer** | D3.js geo projection + SVG rendering of coastlines, routes, ports, nautical styling | Route Planning State (reads), GeoJSON Data (reads) | IN: GeoJSON + route waypoints + ports; OUT: SVG DOM |
| **Trip Summary Panel** | Displays distance, time, per-leg breakdown, speed control | Route Planning State (reads/writes speed) | IN: Route distances, speed; OUT: Formatted display |
| **Export Engine** | Converts rendered SVG to PNG (via canvas) or PDF (via jsPDF) | Map Renderer (reads SVG DOM) | IN: SVG element reference; OUT: File download |

## Data Flow

### Build-Time Pipeline (runs once, output is static)

```
Natural Earth 10m Data
  |
  v
[scripts/prepare-geo.ts]
  | 1. Download ne_10m_lakes + ne_10m_land GeoJSON
  | 2. Filter to Great Lakes by name/scalerank
  | 3. Clip land polygons to bounding box [-92.5, 41.0] to [-75.5, 49.5]
  | 4. Ensure connecting waterways are included as water polygons
  | 5. Simplify geometry if needed to stay under 2MB
  v
lib/geo/great-lakes.json  (FeatureCollection: water + land features)
  |
  v
[scripts/generate-grid.ts]
  | 1. Define grid bounds matching GeoJSON bounding box
  | 2. Choose resolution (~1km = ~0.009 degrees at 45N latitude)
  | 3. For each grid cell center: test booleanPointInPolygon against water polygons
  | 4. Mark cell as 0 (water/walkable) or 1 (land/blocked)
  | 5. Manually ensure connecting waterway corridors are walkable
  |    (St. Marys River, Straits of Mackinac, Detroit River, Welland Canal, St. Lawrence)
  | 6. Serialize as compact format (base64-encoded Uint8Array or JSON matrix)
  v
lib/nav/grid.json  (or grid.bin)
  Metadata: { width, height, minLat, maxLat, minLng, maxLng, resolution }
```

**Key insight:** The grid generation is the most critical build step. At ~1km resolution across the Great Lakes bounding box (~1900km x ~950km), the grid is roughly 1900x950 = ~1.8M cells. Stored as a Uint8Array, that is ~1.8MB. This can be compressed significantly with run-length encoding or stored as a binary blob loaded at runtime.

### Runtime Data Flow

```
User Action Flow:

1. User searches ports  -->  Destination Picker
                                  |
2. User selects port    -->  Route Planning State  (adds port to ordered list)
                                  |
3. State change triggers -->  Navigation Engine
                                  |
   For each consecutive pair of ports:
   a. Convert [lat,lng] to grid [row,col]
   b. Run A* on binary grid (0=walkable, 1=blocked)
   c. Convert result grid cells back to [lat,lng] waypoints
   d. Optional: smooth/simplify waypoint path (Ramer-Douglas-Peucker)
   e. Calculate leg distance in nautical miles (Haversine)
                                  |
4. Route waypoints stored -->  Route Planning State
                                  |
   +--------------------------+---+---+
   |                          |       |
   v                          v       v
Map Renderer            Trip Summary   Export Engine
   |                    Panel              |
   | a. D3 geoAlbers()     |              | (on demand)
   |    .fitSize([w,h],     |              |
   |     geojson)           |              |
   | b. geoPath(projection) |              |
   |    renders coastlines  |              |
   | c. Overlay route as    |              |
   |    SVG polyline/path   |              |
   | d. Port markers as     |              |
   |    SVG circles/icons   |              |
   | e. Nautical styling    |              |
   |    layers (grid lines, |              |
   |    compass rose, depth)|              |
   v                        v              v
  SVG DOM              Distance/Time    SVG->PNG (canvas)
                       Display          SVG->PDF (jsPDF)
```

### State Shape

```typescript
interface AppState {
  // Port selection
  selectedPorts: Port[]           // Ordered list of stops

  // Computed routes (one per consecutive port pair)
  routes: RouteSegment[]          // Each has waypoints[], distanceNm

  // User preferences
  cruiseSpeedKnots: number        // Default: 20

  // Derived (computed from routes + speed)
  totalDistanceNm: number
  totalTimeHours: number

  // UI state
  isCalculating: boolean          // True while A* is running
  searchQuery: string
}

interface RouteSegment {
  from: Port
  to: Port
  waypoints: [number, number][]   // [lng, lat] pairs
  distanceNm: number
  timeHours: number
}
```

## Patterns to Follow

### Pattern 1: Build-Time Data Preprocessing

**What:** Generate the navigation grid and process GeoJSON at build time, not runtime.

**When:** Always. The grid generation involves millions of point-in-polygon tests that would take 10+ seconds in the browser.

**Why:** Separates expensive computation from user experience. The grid is deterministic -- same input always produces same output. No reason to recompute on every page load.

**Implementation:**
```typescript
// scripts/generate-grid.ts (runs via npm script at build time)
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'

function generateGrid(waterPolygons: FeatureCollection, config: GridConfig): Uint8Array {
  const { minLng, maxLng, minLat, maxLat, resolution } = config
  const cols = Math.ceil((maxLng - minLng) / resolution)
  const rows = Math.ceil((maxLat - minLat) / resolution)
  const grid = new Uint8Array(rows * cols) // 0 = water, 1 = land (default)

  // Fill: every cell defaults to land (1)
  grid.fill(1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng = minLng + (c + 0.5) * resolution
      const lat = maxLat - (r + 0.5) * resolution  // Row 0 = north
      const pt = point([lng, lat])

      for (const feature of waterPolygons.features) {
        if (booleanPointInPolygon(pt, feature)) {
          grid[r * cols + c] = 0 // walkable water
          break
        }
      }
    }
  }

  return grid
}
```

**Confidence:** HIGH -- standard geospatial pattern; turf.js booleanPointInPolygon is the canonical JS approach.


### Pattern 2: Coordinate System Bridge

**What:** Clean conversion functions between geographic coordinates [lng, lat] and grid coordinates [row, col]. Every pathfinding-related function accepts/returns geographic coordinates; grid coordinates are internal only.

**When:** At every boundary between the Navigation Engine and the rest of the app.

**Why:** Mixing coordinate systems is the #1 source of bugs in geographic grid applications. Lat goes north (increasing row should decrease), lng goes east. Off-by-one errors in the conversion silently produce routes that clip land corners.

**Implementation:**
```typescript
interface GridMeta {
  width: number       // columns
  height: number      // rows
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
  resolution: number  // degrees per cell
}

function geoToGrid(lng: number, lat: number, meta: GridMeta): [number, number] {
  const col = Math.floor((lng - meta.minLng) / meta.resolution)
  const row = Math.floor((meta.maxLat - lat) / meta.resolution) // Note: inverted
  return [
    Math.max(0, Math.min(meta.height - 1, row)),
    Math.max(0, Math.min(meta.width - 1, col))
  ]
}

function gridToGeo(row: number, col: number, meta: GridMeta): [number, number] {
  const lng = meta.minLng + (col + 0.5) * meta.resolution
  const lat = meta.maxLat - (row + 0.5) * meta.resolution
  return [lng, lat]
}
```

**Confidence:** HIGH -- fundamental geospatial engineering pattern.


### Pattern 3: Pure D3 Projection with React-Owned SVG

**What:** Use D3 only for projection math and path generation (d3.geoAlbers, d3.geoPath). React owns the SVG DOM. D3 never touches the DOM directly.

**When:** Always in React/Next.js applications.

**Why:** D3's DOM manipulation conflicts with React's virtual DOM. Using D3 as a math library avoids this entirely. The projection and path generator are pure functions: input coordinates, output SVG path strings.

**Implementation:**
```tsx
// components/MapRenderer.tsx
import { geoAlbers, geoPath } from 'd3-geo'
import type { FeatureCollection } from 'geojson'

interface MapRendererProps {
  geoData: { water: FeatureCollection; land: FeatureCollection }
  routes: RouteSegment[]
  ports: Port[]
  width: number
  height: number
}

export function MapRenderer({ geoData, routes, ports, width, height }: MapRendererProps) {
  // D3 as pure math -- no DOM manipulation
  const projection = geoAlbers()
    .rotate([84, 0])           // Center on Great Lakes longitude
    .center([0, 45])           // Center on Great Lakes latitude
    .fitSize([width, height], geoData.water)

  const pathGenerator = geoPath(projection)

  return (
    <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      {/* Layer 1: Water background */}
      <rect width={width} height={height} fill="#d4e6f1" />

      {/* Layer 2: Land masses */}
      {geoData.land.features.map((feature, i) => (
        <path key={`land-${i}`} d={pathGenerator(feature) || ''} fill="#f5e6c8" stroke="#8b7355" strokeWidth={0.5} />
      ))}

      {/* Layer 3: Route overlay */}
      {routes.map((route, i) => {
        const projected = route.waypoints.map(([lng, lat]) => projection([lng, lat]))
        const lineData = projected.filter(Boolean).map(p => p!.join(',')).join(' L ')
        return <path key={`route-${i}`} d={`M ${lineData}`} fill="none" stroke="#c0392b" strokeWidth={2} strokeDasharray="8,4" />
      })}

      {/* Layer 4: Port markers */}
      {ports.map(port => {
        const [x, y] = projection([port.lng, port.lat]) || [0, 0]
        return <circle key={port.id} cx={x} cy={y} r={4} fill="#2c3e50" />
      })}
    </svg>
  )
}
```

**Confidence:** HIGH -- well-established React + D3 pattern, documented extensively by Observable and community.


### Pattern 4: Web Worker for A* Pathfinding

**What:** Run A* pathfinding in a Web Worker to avoid blocking the main thread.

**When:** When the grid is large (>500K cells) or routes span long distances.

**Why:** A* on a ~1.8M cell grid for a long route (e.g., Duluth to Kingston) may take 500ms-2s. This freezes the UI if run on the main thread. A Web Worker keeps the UI responsive with a loading indicator.

**Implementation:**
```typescript
// lib/nav/pathfinding.worker.ts
import { astar } from './astar'

self.onmessage = (e: MessageEvent) => {
  const { grid, meta, from, to } = e.data
  const result = astar(grid, meta, from, to)
  self.postMessage(result)
}

// lib/nav/use-pathfinding.ts (React hook)
export function usePathfinding() {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./pathfinding.worker.ts', import.meta.url)
    )
    return () => workerRef.current?.terminate()
  }, [])

  const findRoute = useCallback((from: Port, to: Port): Promise<RouteSegment> => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = (e) => resolve(e.data)
      workerRef.current!.postMessage({ grid, meta, from, to })
    })
  }, [])

  return { findRoute }
}
```

**Confidence:** MEDIUM -- Web Workers with Next.js require careful bundling configuration. The `new URL()` pattern works with webpack 5 (which Next.js uses), but test early. Fallback: run A* on main thread with `requestIdleCallback` chunking.


### Pattern 5: SVG Layer Ordering for Nautical Chart

**What:** Structure the SVG as ordered layers, bottom to top, to achieve the nautical chart aesthetic.

**When:** Always. Layer order determines visual hierarchy.

**Why:** Nautical charts have a specific visual hierarchy: water base, depth contours, land, grid lines, routes, markers, labels, decorative elements. Getting this wrong makes the map unreadable.

**Layer order (bottom to top):**
```
1. Background fill (parchment/cream #fdf6e3)
2. Water polygons (blue gradient - lighter near shore)
3. Decorative depth contours (concentric lighter zones)
4. Land masses (tan/cream with brown stroke)
5. Lat/lng grid lines (thin, semi-transparent)
6. Degree labels on grid lines
7. Route polylines (dashed red/navy with directional arrows)
8. Port markers (anchor icons or styled circles)
9. Port labels (with white text shadow for readability)
10. Compass rose (positioned in open water area)
11. Scale bar
12. Title cartouche (decorative frame)
```

**Confidence:** HIGH -- standard cartographic layering.


## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime Grid Generation

**What:** Computing the navigation grid in the browser from GeoJSON.

**Why bad:** Point-in-polygon testing ~1.8M grid cells against complex lake polygons takes 30-60+ seconds in a browser. Users will leave. Also wastes bandwidth shipping raw polygon data just to process it.

**Instead:** Pre-compute the grid at build time via a Node.js script. Ship only the binary grid artifact (~200KB compressed).

### Anti-Pattern 2: D3 DOM Manipulation in React

**What:** Using `d3.select()` or `d3.append()` to manipulate the SVG DOM.

**Why bad:** React and D3 both want to own the DOM. When both modify the same elements, you get stale references, missed updates, and hard-to-debug rendering glitches.

**Instead:** Use D3 purely for math (projection, path generation, scales). Let React render all SVG elements via JSX.

### Anti-Pattern 3: Storing Routes as Grid Coordinates

**What:** Keeping A* output as grid [row, col] arrays and converting to geo coordinates only at render time.

**Why bad:** Grid coordinates are meaningless outside the navigation engine. If grid resolution changes, all stored routes become invalid. Distance calculations on grid coords require grid metadata. Serialization couples to grid format.

**Instead:** Convert to [lng, lat] immediately after A* completes. All downstream consumers work with geographic coordinates.

### Anti-Pattern 4: Single Monolithic A* Call for Multi-Stop Routes

**What:** Trying to route through all waypoints in a single A* invocation.

**Why bad:** A* finds a path between exactly two points. Multi-waypoint routing requires chaining. Trying to hack waypoints into the heuristic breaks optimality guarantees.

**Instead:** Chain separate A* calls: port1->port2, port2->port3, etc. Each segment is independent. This also enables caching individual segments when users reorder stops.

### Anti-Pattern 5: Loading Full GeoJSON for Pathfinding

**What:** Using the same detailed GeoJSON for both rendering and grid generation.

**Why bad:** Rendering needs high-detail coastlines for visual fidelity. Pathfinding needs a simple binary grid. Shipping detailed GeoJSON (potentially 5-10MB un-simplified) for pathfinding wastes bandwidth and memory.

**Instead:** Two separate data artifacts: (1) render-quality GeoJSON for the map, (2) compact binary grid for pathfinding. Both derived from the same source at build time.

## Scalability Considerations

| Concern | Current Design (~100 ports) | If Extended (500+ ports) | If Extended (real-time) |
|---------|---------------------------|-------------------------|------------------------|
| Grid size | ~1.8M cells, ~200KB gzipped | Same grid | Same grid |
| A* performance | <2s for longest routes | Same (grid unchanged) | Need server-side for multi-user |
| GeoJSON rendering | <2MB, renders fast | Same (coastlines unchanged) | Tile-based approach needed |
| Port search | Linear scan of 100 items, instant | Need fuzzy search index (Fuse.js) | Database + API |
| State management | React Context / useReducer | Same | Redux or Zustand |
| Export | Client-side SVG->PNG/PDF fine | Same | Same |

For this project's scope (static port list, fixed geography, client-side only), the architecture is well-matched. No server needed. No scaling concerns for v1.

## Suggested Build Order

Based on component dependencies, the recommended build sequence is:

```
Phase 1: Foundation (no dependencies)
  |-- GeoJSON Data Pipeline (scripts/prepare-geo.ts + great-lakes.json)
  |-- Port Database (ports.json + ports.ts)
  |-- Project scaffold (Next.js + dependencies)

Phase 2: Core Engine (depends on Phase 1)
  |-- Navigation Grid generation (depends on GeoJSON)
  |-- A* Pathfinder (depends on Navigation Grid)
  |-- Coordinate conversion utilities

Phase 3: Visualization (depends on Phase 1, parallel with Phase 2 partially)
  |-- Map Renderer with D3 projection (depends on GeoJSON)
  |-- Coastline + land rendering
  |-- Port markers on map

Phase 4: Integration (depends on Phases 2 + 3)
  |-- Route Planning State (connects picker, engine, renderer)
  |-- Destination Picker UI
  |-- Route overlay on map
  |-- Trip Summary Panel

Phase 5: Polish (depends on Phase 4)
  |-- Nautical chart styling (compass rose, grid lines, depth shading)
  |-- Export engine (SVG, PNG, PDF)
  |-- Performance optimization (Web Worker, path smoothing)
  |-- Responsive layout
```

**Rationale:** GeoJSON and ports are pure data with no code dependencies -- build first. The navigation grid and A* engine can be developed and tested independently of any UI. Map rendering can start as soon as GeoJSON exists. Integration wires everything together. Polish comes last because it is purely additive.

## Sources

- [D3 Geo documentation](https://d3js.org/d3-geo) - Official D3 geographic projections and path generation
- [D3 Geo Projections](https://d3js.org/d3-geo/projection) - Projection types including Albers
- [D3 Geo Paths](https://d3js.org/d3-geo/path) - SVG path generation from GeoJSON
- [D3 In Depth - Geographic](https://www.d3indepth.com/geographic/) - Comprehensive D3 geo tutorial
- [PathFinding.js](https://github.com/qiao/PathFinding.js) - Reference A* implementation for grid-based pathfinding
- [Red Blob Games - Grid Pathfinding](https://www.redblobgames.com/pathfinding/grids/algorithms.html) - Grid pathfinding optimization techniques (JPS, grid resolution)
- [React + D3 SVG Maps pattern](https://medium.com/@zimrick/how-to-create-pure-react-svg-maps-with-topojson-and-d3-geo-e4a6b6848a98) - Using D3 as math library with React-owned SVG
- [Turf.js - Point in Polygon](https://turfjs.org/docs/api/polygon) - Geospatial analysis for grid rasterization
- [Building Maps with React, SVG and D3](https://www.codefeetime.com/post/building-a-map-with-svg-and-react/) - React SVG map rendering patterns
