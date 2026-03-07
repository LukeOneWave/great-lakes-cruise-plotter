# Phase 3: Pathfinding Engine - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning
**Source:** Auto-generated from project context (--auto mode)

<domain>
## Phase Boundary

Implement A* pathfinding on the navigation grid to compute water-only routes between any two ports. Display computed routes as dashed lines with directional indicators on the nautical map SVG. No multi-stop planning, drag-to-reorder, or distance/time calculations — those are Phase 4.

Requirements: ROUTE-01 (water-only A* routing), VIZ-03 (route drawn as dashed line with directional indicators)

</domain>

<decisions>
## Implementation Decisions

### A* Algorithm
- Custom A* implementation (not a library — PathFinding.js is unmaintained per STATE.md)
- Operates on the navigation grid (850x425 cells, 0.02 degree resolution)
- 8-directional movement (including diagonals) for natural-looking routes
- Heuristic: Haversine distance to goal (accounts for spherical geometry at Great Lakes scale)
- Route must never cross land — guaranteed by grid cells (0=land, 1=water)

### Route Display
- Route drawn as dashed SVG path on top of the map layers (after ports, before compass rose)
- Dashed line style: nautical feel, visible against both water and land backgrounds
- Directional indicators: small arrowheads or chevrons along the route line showing travel direction
- Route color: distinct from port markers and coastlines (e.g., dark red or navy blue)
- Route should be visually smooth — convert grid cell path to projected SVG coordinates, then simplify

### Path Smoothing
- Raw A* output is grid-cell-based (staircase pattern) — needs smoothing for visual appeal
- Apply Douglas-Peucker or similar simplification to reduce waypoints while preserving shape
- Convert grid coordinates back to lat/lng, then project to SVG coordinates

### Performance
- Route must compute in under 2 seconds for any port pair (including cross-lake via waterways)
- Use binary heap for A* priority queue (standard optimization)
- Grid is preloaded — no I/O during pathfinding

### Claude's Discretion
- Exact dash pattern and line width for route SVG
- Arrow/chevron design for directional indicators
- Path simplification threshold
- Whether to use Web Worker for pathfinding (may not be needed if <2s)
- Route line opacity and color exact values

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/grid/grid.ts`: `loadGrid()`, `toCell()`, `isWater()`, `findNearestWaterCell()` — core grid utilities for A*
- `lib/grid/types.ts`: `NavigationGrid` interface with width, height, bbox, cellSize, data
- `lib/ports/ports.ts`: `getPortById()` for resolving port coordinates
- `components/map/NauticalMap.tsx`: SVG map component — route layer will be added here
- `components/map/use-map-projection.ts`: `useMapProjection` hook returns projection and path generator
- `components/map/constants.ts`: NAUTICAL_COLORS for consistent styling

### Established Patterns
- d3-geo for math, React JSX for SVG rendering
- "use client" for interactive components
- Vitest + jsdom for component testing
- TypeScript strict mode, @/* path aliases

### Integration Points
- A* engine: new `lib/pathfinding/` module (pure logic, no React)
- Route layer: new `components/map/RouteLayer.tsx` component
- NauticalMap: add RouteLayer between PortLayer and CompassRose
- Grid data: already loaded, pass to pathfinding engine

</code_context>

<specifics>
## Specific Ideas

- STATE.md confirms: "Custom A* over library (PathFinding.js unmaintained 10 years)"
- Routes must traverse connecting waterways correctly — corridor overrides ensure grid connectivity
- The A* engine should be a pure function (grid + start + end → path) for easy testing
- Route display is the first visual feedback users get that the app actually "works" — it should look polished

</specifics>

<deferred>
## Deferred Ideas

- Multi-stop routing — Phase 4 (ROUTE-02)
- Distance/time calculations — Phase 4 (ROUTE-03, ROUTE-04)
- Animated route drawing — v2 (VIS-01)

</deferred>

---

*Phase: 03-pathfinding-engine*
*Context gathered: 2026-03-07 via auto-mode*
