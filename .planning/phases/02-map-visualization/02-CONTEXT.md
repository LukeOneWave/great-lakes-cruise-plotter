# Phase 2: Map Visualization - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning
**Source:** Auto-generated from project context (--auto mode)

<domain>
## Phase Boundary

Render a nautical chart SVG of the Great Lakes with coastlines, port markers, and nautical styling. Users see a beautiful map with all ports visible, selected ports highlighted. No routing or interaction beyond port selection — those are Phase 3 and 4.

Requirements: VIZ-01 (nautical chart SVG), VIZ-02 (port markers with labels and selection highlighting)

</domain>

<decisions>
## Implementation Decisions

### Nautical Chart Styling
- Parchment/cream background (#f5e6c8 range) — classic nautical chart feel
- Water areas filled with light blue with subtle depth gradient shading (decorative only, not bathymetric)
- Coastlines rendered as dark lines with land fill in parchment tone
- Compass rose placed in an open water area (Lake Huron or Lake Superior has space)
- Lat/lng grid lines as subtle dashed lines with degree labels at edges
- Font choice: serif for labels (nautical tradition), clean sans-serif for UI controls

### Port Markers
- All ~86 ports displayed as small circular markers on the map
- Default state: small dots with minimal visual weight so map isn't cluttered
- Selected/highlighted state: larger marker with label, distinct color (e.g., red or gold accent)
- Port labels shown on hover/selection only — not all at once (too many for readability)
- Ports grouped visually by lake via subtle color coding or proximity

### Map Projection & Layout
- Use d3-geo Albers Equal Area or Mercator projection optimized for Great Lakes bounding box
- Map fills the main content area — full-width responsive SVG
- SVG rendered inline (not as image) for interactivity and future route overlay (Phase 3)
- d3-geo geoPath for rendering TopoJSON coastlines via topojson-client feature extraction

### Rendering Approach
- React component wrapping an SVG element
- Use d3-geo for projection/path math, but render via React JSX (not d3 DOM manipulation)
- "use client" directive since map needs interactivity (hover, click for port selection)
- Load TopoJSON and port data at component mount, project to SVG coordinates

### Claude's Discretion
- Exact color palette values and opacity levels
- Compass rose design complexity (simple vs ornate)
- Depth shading gradient technique (CSS gradients vs SVG patterns)
- Port marker size and exact highlight animation
- Map padding and margin decisions
- Whether to use SVG filter effects for the parchment texture

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/geo/load-geo.ts`: `loadCoastlines()` — returns GeoJSON FeatureCollection from TopoJSON
- `lib/geo/great-lakes.topo.json`: 73.5KB optimized coastline data with 105 features
- `lib/ports/ports.ts`: `getAllPorts()`, `searchPorts()`, `getPortsByLake()`, `getPortById()`
- `lib/ports/ports.json`: 86 curated ports with lat/lng, lake, type fields
- `lib/geo/types.ts`: GreatLakeName type, WaterwayCorridor interface
- `lib/ports/types.ts`: Port interface with id, name, lat, lng, lake, type, country, state

### Established Patterns
- TypeScript strict mode with path alias `@/*`
- Vitest for testing with jsdom environment
- Tailwind CSS v4 for utility styling
- Next.js App Router with server components by default, "use client" for interactivity
- d3-geo already installed (v3.1.1) with d3-geo-projection (v4.0.0)

### Integration Points
- `app/page.tsx`: Currently boilerplate — will be replaced with map component
- topojson-client already installed as runtime dependency
- Port data loads synchronously from JSON import

</code_context>

<specifics>
## Specific Ideas

- Project core value emphasizes "beautiful nautical-style map" — this is the hero visual of the entire app
- Requirements specify: parchment background, compass rose, depth shading, lat/lng grid
- The map must serve as the canvas for future route drawing (Phase 3) and multi-stop planning (Phase 4)
- SVG approach enables future SVG export (Phase 5, EXP-01) without re-rendering

</specifics>

<deferred>
## Deferred Ideas

- Route line rendering — Phase 3 (VIZ-03)
- Click-to-drop-pin on map — v2 (INT-01)
- Animated route drawing — v2 (VIS-01)
- Multiple chart themes — v2 (VIS-02)
- Print-optimized layout — v2 (VIS-03)

</deferred>

---

*Phase: 02-map-visualization*
*Context gathered: 2026-03-07 via auto-mode*
