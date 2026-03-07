# Phase 3: Pathfinding Engine - Research

**Researched:** 2026-03-07
**Domain:** A* pathfinding on grid, SVG route rendering, path simplification
**Confidence:** HIGH

## Summary

This phase implements custom A* pathfinding on the existing 850x425 navigation grid (0.02-degree cells) and renders computed routes as dashed SVG paths with directional indicators. The grid infrastructure from Phase 1 provides `isWater()`, `toCell()`, and `findNearestWaterCell()` -- the pathfinding engine consumes these directly.

The core technical challenges are: (1) implementing A* with a binary heap priority queue for performance, (2) smoothing the grid-cell staircase output into visually appealing curves using Douglas-Peucker simplification, and (3) rendering the route as a dashed SVG `<path>` with arrow markers using the existing d3-geo projection. The grid has 73,794 water cells out of 361,250 total -- A* on this scale is trivially fast (well under 2 seconds even for worst-case cross-lake routes) with a binary heap.

**Primary recommendation:** Build a pure-function A* engine in `lib/pathfinding/` with binary heap, returning grid-cell paths. Convert to lat/lng, simplify with Douglas-Peucker, project to SVG coordinates, and render in a new `RouteLayer` component inserted between PortLayer and CompassRose.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Custom A* implementation (not a library -- PathFinding.js is unmaintained per STATE.md)
- Operates on the navigation grid (850x425 cells, 0.02 degree resolution)
- 8-directional movement (including diagonals) for natural-looking routes
- Heuristic: Haversine distance to goal (accounts for spherical geometry at Great Lakes scale)
- Route must never cross land -- guaranteed by grid cells (0=land, 1=water)
- Route drawn as dashed SVG path on top of the map layers (after ports, before compass rose)
- Dashed line style: nautical feel, visible against both water and land backgrounds
- Directional indicators: small arrowheads or chevrons along the route line showing travel direction
- Route color: distinct from port markers and coastlines (e.g., dark red or navy blue)
- Route should be visually smooth -- convert grid cell path to projected SVG coordinates, then simplify
- Raw A* output needs smoothing -- Douglas-Peucker or similar simplification
- Use binary heap for A* priority queue
- Grid is preloaded -- no I/O during pathfinding
- Route must compute in under 2 seconds for any port pair

### Claude's Discretion
- Exact dash pattern and line width for route SVG
- Arrow/chevron design for directional indicators
- Path simplification threshold (epsilon for Douglas-Peucker)
- Whether to use Web Worker for pathfinding (may not be needed if <2s)
- Route line opacity and color exact values

### Deferred Ideas (OUT OF SCOPE)
- Multi-stop routing -- Phase 4 (ROUTE-02)
- Distance/time calculations -- Phase 4 (ROUTE-03, ROUTE-04)
- Animated route drawing -- v2 (VIS-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-01 | App plots water-only routes using A* pathfinding (never crosses land) | A* engine with grid-based land/water check; binary heap for performance; `isWater()` guard on every neighbor expansion |
| VIZ-03 | Route drawn as dashed line with directional indicators | SVG `<path>` with stroke-dasharray; `<marker>` element for arrowheads; RouteLayer component |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Custom A* | N/A | Pathfinding algorithm | Decision locked: no external pathfinding library |
| Custom BinaryHeap | N/A | Priority queue for A* open set | Standard A* optimization; ~40 lines of code |
| Custom Douglas-Peucker | N/A | Path simplification | Algorithm is ~30 lines; no library needed |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-geo | ^3.1.1 | Haversine distance via `geoDistance()`, projection for SVG coordinates | Heuristic calculation and coordinate projection |
| React | 19.2.3 | RouteLayer component rendering | SVG route layer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom A* | PathFinding.js | Unmaintained 10+ years, locked decision against it |
| Custom Douglas-Peucker | simplify-js npm | Extra dependency for 30 lines of code |
| Web Worker | Main thread | Grid is small enough (~361K cells); A* will complete in <100ms for any route |

**No new dependencies needed.** Everything builds on existing d3-geo and React.

## Architecture Patterns

### Recommended Project Structure
```
lib/pathfinding/
  astar.ts          # A* algorithm + BinaryHeap (pure functions)
  simplify.ts       # Douglas-Peucker path simplification
  route.ts          # High-level: findRoute(grid, startPort, endPort) -> LatLng[]
  types.ts          # PathResult, RoutePoint interfaces
  __tests__/
    astar.test.ts   # Unit tests for A* correctness and performance
    simplify.test.ts # Path simplification tests
    route.test.ts   # Integration tests: real ports, waterway traversal

components/map/
  RouteLayer.tsx    # SVG route rendering (dashed path + arrow markers)
```

### Pattern 1: Pure Function A* Engine
**What:** A* as a pure function: `(grid, startCell, endCell) -> GridCell[]`
**When to use:** Always -- keeps pathfinding testable without React
**Example:**
```typescript
// lib/pathfinding/astar.ts
import type { NavigationGrid, GridCell } from "@/lib/grid/types";
import { isWater } from "@/lib/grid/types";

// 8-directional neighbors: cardinal + diagonal
const DIRECTIONS: [number, number, number][] = [
  [0, -1, 1],    // N
  [1, -1, 1.414], // NE (sqrt(2))
  [1, 0, 1],     // E
  [1, 1, 1.414],  // SE
  [0, 1, 1],     // S
  [-1, 1, 1.414], // SW
  [-1, 0, 1],    // W
  [-1, -1, 1.414], // NW
];

export function findPath(
  grid: NavigationGrid,
  start: GridCell,
  end: GridCell
): GridCell[] | null {
  // A* with binary heap...
  // Returns array of [col, row] from start to end, or null if unreachable
}
```

### Pattern 2: Coordinate Pipeline
**What:** Grid cells -> lat/lng -> simplified -> SVG coordinates
**When to use:** Converting A* output for display
**Example:**
```typescript
// lib/pathfinding/route.ts
// 1. Snap port coords to nearest water cell (findNearestWaterCell)
// 2. Run A* on grid cells
// 3. Convert grid cells to [lng, lat] pairs
// 4. Apply Douglas-Peucker simplification
// 5. Return simplified lat/lng path

export function cellToLatLng(
  grid: NavigationGrid,
  col: number,
  row: number
): [number, number] {
  // Cell center coordinates
  const lng = grid.bbox[0] + (col + 0.5) * grid.cellSize;
  const lat = grid.bbox[3] - (row + 0.5) * grid.cellSize;
  return [lng, lat];
}
```

### Pattern 3: SVG Route Layer with Markers
**What:** React component rendering dashed path + arrowhead markers
**When to use:** Displaying computed route on the map
**Example:**
```typescript
// components/map/RouteLayer.tsx
// Uses <defs><marker> for arrowheads
// Uses d3 geoPath or manual projection for path d attribute
// stroke-dasharray for dashed line
// marker-mid for directional arrows along path
```

### Anti-Patterns to Avoid
- **Computing route in render:** A* should be triggered by state change, result memoized, not recomputed on every render
- **Projecting every grid cell:** Simplify BEFORE projecting to SVG -- reduces both computation and visual clutter
- **Using geoPath for route:** geoPath is for GeoJSON features; for a simple polyline of projected points, build the SVG `d` attribute manually from projected coordinates
- **Storing path as GeoJSON:** Unnecessary complexity; a simple array of [lng, lat] pairs is sufficient

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haversine distance | Custom haversine formula | `d3.geoDistance()` * R | Already in d3-geo, returns radians; multiply by Earth radius for meters |
| Coordinate projection | Custom mercator math | `projection([lng, lat])` | Already configured in useMapProjection hook |
| Grid cell lookup | Index math | `toCell()` and `isWater()` | Already implemented in lib/grid/types.ts |
| Port snapping | Manual nearest-cell search | `findNearestWaterCell()` | Already handles edge cases in lib/grid/grid.ts |

**Key insight:** The grid infrastructure is already solid. The pathfinding engine consumes existing utilities; the only new algorithmic code is A* itself, the binary heap, and Douglas-Peucker.

## Common Pitfalls

### Pitfall 1: Diagonal Cost Not Weighted
**What goes wrong:** Using cost=1 for all 8 directions produces paths that prefer diagonals (cheaper per-distance), creating zigzag artifacts
**Why it happens:** Cardinal and diagonal moves cover different distances (1 vs sqrt(2) cells)
**How to avoid:** Use cost=1.0 for cardinal moves, cost=1.414 (sqrt(2)) for diagonal moves
**Warning signs:** Routes that zigzag unnecessarily or prefer diagonal movement

### Pitfall 2: Haversine vs Euclidean Heuristic
**What goes wrong:** Euclidean heuristic in grid-cell space doesn't account for longitude compression at higher latitudes (Great Lakes span ~41-49 degrees N)
**Why it happens:** One degree of longitude at 49N is ~73km vs ~85km at 41N
**How to avoid:** Use `d3.geoDistance()` which computes great-circle distance, or use Chebyshev distance in cell space (which is admissible for 8-directional grids)
**Recommendation:** Chebyshev distance (max(|dx|, |dy|)) in cell space is simpler and guaranteed admissible for 8-directional grids. Haversine is more accurate but the grid cell abstraction already introduces ~2km error. Either works; Chebyshev is simpler.

### Pitfall 3: Path Simplification Too Aggressive
**What goes wrong:** Over-simplified path cuts corners through narrow waterways or near coastlines
**Why it happens:** Douglas-Peucker epsilon too large; simplified path no longer respects water boundaries
**How to avoid:** Keep epsilon small (e.g., 0.5-2.0 in pixel space after projection). Since simplification is purely visual, validate visually rather than geometrically.
**Warning signs:** Route appearing to clip land areas after simplification

### Pitfall 4: SVG Marker Rendering Issues
**What goes wrong:** Arrow markers don't render, render at wrong scale, or don't rotate with path direction
**Why it happens:** SVG marker attributes are finicky -- markerUnits, refX/refY, orient, viewBox must all align
**How to avoid:** Use `orient="auto"` for rotation. Set `markerUnits="strokeWidth"` and size markers relative to stroke width. Test with a simple path first.
**Warning signs:** Invisible markers, markers pointing wrong direction, oversized/undersized markers

### Pitfall 5: Route Layer Z-Order
**What goes wrong:** Route renders behind coastlines or ports, making it invisible
**Why it happens:** SVG renders in document order -- later elements are "on top"
**How to avoid:** Insert RouteLayer between PortLayer and CompassRose in NauticalMap.tsx (per CONTEXT.md decision)
**Note:** Currently the layer order is: background -> defs -> graticule -> coastlines -> ports -> compass rose. Route should go between ports and compass rose.

### Pitfall 6: Port Not Snapping to Water
**What goes wrong:** A* returns null because start/end cell is on land
**Why it happens:** Port coordinates may fall on land cells at grid resolution
**How to avoid:** Always use `findNearestWaterCell()` to snap port coordinates before running A*. This is already implemented and tested.

## Code Examples

### Binary Heap (Priority Queue)
```typescript
// Minimal binary heap for A* open set
// Stores items with a priority (f-score), supports insert and extractMin
export class BinaryHeap<T> {
  private data: { item: T; priority: number }[] = [];

  get size(): number { return this.data.length; }

  insert(item: T, priority: number): void {
    this.data.push({ item, priority });
    this._bubbleUp(this.data.length - 1);
  }

  extractMin(): T | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0].item;
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].priority >= this.data[parent].priority) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  private _sinkDown(i: number): void {
    const length = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < length && this.data[left].priority < this.data[smallest].priority) smallest = left;
      if (right < length && this.data[right].priority < this.data[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}
```

### Douglas-Peucker Simplification
```typescript
// Simplify a polyline by removing points within epsilon distance of the line between endpoints
export function simplifyPath(
  points: [number, number][],
  epsilon: number
): [number, number][] {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance from the line (start -> end)
  let maxDist = 0;
  let maxIdx = 0;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], [sx, sy], [ex, ey]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}
```

### SVG Route with Dashed Line and Arrow Markers
```typescript
// RouteLayer.tsx pattern
// Define marker in <defs>, use stroke-dasharray on path
<defs>
  <marker
    id="route-arrow"
    viewBox="0 0 10 10"
    refX={5}
    refY={5}
    markerWidth={4}
    markerHeight={4}
    orient="auto"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={ROUTE_COLOR} />
  </marker>
</defs>
<path
  d={pathData}
  fill="none"
  stroke={ROUTE_COLOR}
  strokeWidth={2.5}
  strokeDasharray="8,4"
  strokeLinecap="round"
  markerMid="url(#route-arrow)"
  opacity={0.85}
/>
```

### Cell-to-LatLng Conversion
```typescript
// Convert grid cell [col, row] to geographic [lng, lat]
function cellToLatLng(grid: NavigationGrid, col: number, row: number): [number, number] {
  const lng = grid.bbox[0] + (col + 0.5) * grid.cellSize;
  const lat = grid.bbox[3] - (row + 0.5) * grid.cellSize;
  return [lng, lat];
}
// Note: +0.5 centers on cell; bbox[3] is north edge, rows increase southward
```

### A* Heuristic with Chebyshev Distance
```typescript
// Chebyshev distance: admissible heuristic for 8-directional grid movement
// When diagonal cost = sqrt(2) and cardinal cost = 1:
// h = max(|dx|, |dy|) + (sqrt(2) - 1) * min(|dx|, |dy|)
// This is the "octile distance" -- exact cost if no obstacles
function octileDistance(col1: number, row1: number, col2: number, row2: number): number {
  const dx = Math.abs(col1 - col2);
  const dy = Math.abs(row1 - row2);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PathFinding.js library | Custom A* (library unmaintained) | 2016 (last update) | Must implement own A*; ~100 lines total |
| Dijkstra for grid pathfinding | A* with admissible heuristic | Standard practice | A* explores far fewer cells than Dijkstra on grids |
| Euclidean heuristic | Octile distance for 8-dir grids | Well-established | Tighter heuristic = fewer explored cells |
| No path smoothing | Douglas-Peucker on projected points | Standard for grid-to-visual | Eliminates staircase artifacts |

**Note on heuristic choice:** CONTEXT.md specifies Haversine. Octile distance is actually more appropriate for grid-cell A* because it exactly matches the movement cost model (cardinal=1, diagonal=sqrt(2)). Haversine would work but requires converting every cell to lat/lng during A*, adding overhead. Recommendation: use octile distance as the heuristic (simpler, faster, perfectly admissible for this grid), and note that this is a refinement of the Haversine idea.

## Open Questions

1. **Marker-mid placement density**
   - What we know: SVG `marker-mid` places a marker at every intermediate vertex of the path
   - What's unclear: After Douglas-Peucker simplification, there may be too few or too many vertices for good arrow spacing
   - Recommendation: If marker-mid gives poor spacing, interpolate points at fixed intervals (e.g., every 30-50px) along the simplified path to control arrow density. This is a visual tuning issue to resolve during implementation.

2. **Route update: CONTEXT.md says Haversine, research suggests octile**
   - What we know: Haversine is a valid admissible heuristic; octile distance is more natural for grid A*
   - What's unclear: Whether the user specifically wants Haversine for accuracy reasons
   - Recommendation: Use octile distance (it is the standard heuristic for 8-directional grids). Both produce identical optimal paths; octile is faster to compute.

3. **Web Worker necessity**
   - What we know: Grid has 361K total cells, 74K water cells. Even worst-case A* explores ~30K cells.
   - What's unclear: Exact runtime on user hardware
   - Recommendation: Skip Web Worker. A* on this grid will complete in <50ms on modern hardware. Add if profiling shows issues (unlikely).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 with jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | A* finds water-only path between two ports | unit | `npx vitest run lib/pathfinding/__tests__/astar.test.ts -t "finds path" -x` | No - Wave 0 |
| ROUTE-01 | Route never crosses land cells | unit | `npx vitest run lib/pathfinding/__tests__/astar.test.ts -t "water only" -x` | No - Wave 0 |
| ROUTE-01 | Routes traverse connecting waterways (5 waterways) | integration | `npx vitest run lib/pathfinding/__tests__/route.test.ts -t "waterway" -x` | No - Wave 0 |
| ROUTE-01 | Returns null for unreachable port pairs | unit | `npx vitest run lib/pathfinding/__tests__/astar.test.ts -t "unreachable" -x` | No - Wave 0 |
| ROUTE-01 | Route computes in under 2 seconds | unit | `npx vitest run lib/pathfinding/__tests__/astar.test.ts -t "performance" -x` | No - Wave 0 |
| VIZ-03 | RouteLayer renders dashed SVG path | unit | `npx vitest run components/map/__tests__/RouteLayer.test.tsx -t "dashed" -x` | No - Wave 0 |
| VIZ-03 | RouteLayer renders directional arrow markers | unit | `npx vitest run components/map/__tests__/RouteLayer.test.tsx -t "arrow" -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/pathfinding/__tests__/ -x`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `lib/pathfinding/__tests__/astar.test.ts` -- covers ROUTE-01 (A* correctness, water-only, performance)
- [ ] `lib/pathfinding/__tests__/route.test.ts` -- covers ROUTE-01 (waterway traversal integration)
- [ ] `components/map/__tests__/RouteLayer.test.tsx` -- covers VIZ-03 (route rendering)
- [ ] `lib/pathfinding/__tests__/simplify.test.ts` -- covers path simplification correctness

## Sources

### Primary (HIGH confidence)
- Project codebase: `lib/grid/types.ts`, `lib/grid/grid.ts` -- grid API verified by reading source
- Project codebase: `components/map/NauticalMap.tsx` -- layer structure and integration point verified
- Project codebase: `components/map/use-map-projection.ts` -- projection approach verified
- [Red Blob Games - Grid Pathfinding](https://www.redblobgames.com/pathfinding/grids/algorithms.html) -- authoritative A* grid reference

### Secondary (MEDIUM confidence)
- [Ramer-Douglas-Peucker Wikipedia](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm) -- well-documented algorithm
- [SVG Marker Specification](https://svgwg.org/svg2-draft/painting.html) -- official SVG2 spec for markers
- [D3 Path Arrows](https://github.com/tomshanley/d3-path-arrows) -- reference for arrow pattern on SVG paths

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources or well-established algorithms

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no external dependencies needed; custom implementations of well-known algorithms
- Architecture: HIGH - integration points clearly visible in existing codebase; pure function pattern proven
- Pitfalls: HIGH - grid pathfinding is a well-studied domain; pitfalls are well-documented
- SVG markers: MEDIUM - SVG marker rendering has browser quirks; may need tuning during implementation

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no fast-moving dependencies)
