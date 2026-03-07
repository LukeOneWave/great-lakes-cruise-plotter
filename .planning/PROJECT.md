# Great Lakes Cruise Plotter

## What This Is

A client-side web application for plotting water-only cruise routes across the Great Lakes. Users select ports from a curated list of 86 locations, build multi-stop itineraries with drag-to-reorder, and view routes on a nautical chart-styled SVG map. Routes are guaranteed to stay on water via A* pathfinding on a pre-computed navigation grid. Maps can be exported as SVG, PNG, or PDF.

## Core Value

Users can visually plan multi-stop boat routes across the Great Lakes that are guaranteed to stay on water, displayed on a beautiful nautical-style map.

## Requirements

### Validated

- ✓ DATA-01: High-detail Great Lakes coastlines for all 5 lakes with major islands (via TopoJSON) — v1.0
- ✓ DATA-02: Routing through connecting waterways (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, upper St. Lawrence) — v1.0
- ✓ DATA-03: Search and select from 86 curated Great Lakes ports — v1.0
- ✓ ROUTE-01: Water-only routes using A* pathfinding (never crosses land) — v1.0
- ✓ ROUTE-02: Multi-stop routes with drag-to-reorder — v1.0
- ✓ ROUTE-03: Trip distance (nm), estimated travel time, and per-leg breakdown — v1.0
- ✓ ROUTE-04: Adjustable cruise speed (5-30 knots) updates travel time instantly — v1.0
- ✓ VIZ-01: Nautical chart SVG (parchment background, compass rose, depth shading, lat/lng grid) — v1.0
- ✓ VIZ-02: All ports displayed as markers; selected ports highlighted with labels — v1.0
- ✓ VIZ-03: Route drawn as dashed line with directional arrow markers — v1.0
- ✓ EXP-01: Export map as SVG — v1.0
- ✓ EXP-02: Export map as high-res PNG (2x resolution) — v1.0
- ✓ EXP-03: Export map as print-ready PDF (via SVG->Canvas->PNG->PDF pipeline) — v1.0

### Active

(None — v1.0 complete. Define next milestone requirements with `/gsd:new-milestone`.)

### Out of Scope

- Real-time weather or water conditions — adds API dependency and complexity
- User accounts or saved routes — keep it stateless for v1
- Mobile-native app — web-first, responsive design sufficient
- Turn-by-turn navigation — this is a planning/visualization tool
- Bathymetric (depth) data accuracy — decorative depth shading only
- Tide or lock scheduling — informational only

## Context

Shipped v1.0 with 4,271 LOC TypeScript across 131 files.
Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, d3-geo, jsPDF, Vitest.
86 curated ports, 73.5KB TopoJSON coastlines, 705KB navigation grid (850x425 cells at 0.02 degree resolution).
Custom A* pathfinding with binary heap, octile heuristic, 8-directional movement.

## Constraints

- **No backend**: Everything runs client-side — no API keys, no server, no database
- **Performance**: A* pathfinding completes in <2 seconds for any route on the ~2km grid
- **Bundle size**: TopoJSON data is 73.5KB, navigation grid is 705KB
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side A* over LLM routing | No API costs, works offline, deterministic results | ✓ Good |
| SVG over Canvas rendering | Native SVG export, easier nautical styling with patterns/filters | ✓ Good |
| Static port JSON over API | No backend needed, fast, simple | ✓ Good |
| Nautical chart style over Google Maps style | More distinctive, fits the maritime theme | ✓ Good |
| d3-geo geoConicEqualArea projection | Good for mid-latitude regions, minimal distortion for Great Lakes | ✓ Good |
| Custom A* over PathFinding.js | PathFinding.js unmaintained 10 years, custom gives full control | ✓ Good |
| TopoJSON over GeoJSON | 80-85% size reduction (73.5KB vs ~500KB) | ✓ Good |
| 0.02 degree grid resolution (~2km) | Fast generation, adequate pathfinding, 73,794 water cells | ✓ Good |
| CW-wound corridor polygons | Required for d3-geo spherical containment in narrow waterways | ✓ Good |
| HTML5 native DnD for stop reorder | Zero dependencies, works well for ordered list | ✓ Good |
| Douglas-Peucker simplification (epsilon=0.01) | Removes grid staircase while preserving route shape | ✓ Good |
| SVG->Canvas->PNG->PDF pipeline | Reusable renderToCanvas for both PNG and PDF export | ✓ Good |
| NauticalMap forwardRef | Exposes SVG element for export without prop drilling | ✓ Good |

---
*Last updated: 2026-03-07 after v1.0 milestone*
