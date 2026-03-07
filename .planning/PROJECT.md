# Great Lakes Cruise Plotter

## What This Is

A web application that generates custom water cruise maps for the Great Lakes region. Users enter destinations from a searchable port list, and the app plots water-only routes on a nautical chart-styled SVG map using client-side A* pathfinding. Routes never cross land. The map can be exported as SVG, PNG, or PDF.

## Core Value

Users can visually plan multi-stop boat routes across the Great Lakes that are guaranteed to stay on water, displayed on a beautiful nautical-style map.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can search and select ports from a curated list of ~80-100 Great Lakes locations
- [ ] User can add multiple stops and reorder them
- [ ] App plots a water-only route between all stops using A* pathfinding
- [ ] Route never crosses land — uses a pre-computed navigation grid rasterized from GeoJSON
- [ ] All 5 Great Lakes covered (Superior, Michigan, Huron, Erie, Ontario)
- [ ] Connecting waterways navigable (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, upper St. Lawrence)
- [ ] Map rendered as SVG with nautical chart styling (parchment background, depth gradient, compass rose, lat/lng grid)
- [ ] High-detail GeoJSON coastlines including major islands (Manitoulin, Apostle Islands, Isle Royale, etc.)
- [ ] Trip summary shows total distance (nautical miles), estimated travel time, and per-leg breakdown
- [ ] User can adjust cruise speed (knots) to update travel time estimate
- [ ] Export map as SVG, PNG, or PDF
- [ ] Port markers and labels displayed on map
- [ ] Selected ports highlighted with route overlay

### Out of Scope

- Real-time weather or water conditions — adds API dependency and complexity
- User accounts or saved routes — keep it stateless for v1
- Mobile-native app — web-first, responsive design sufficient
- Turn-by-turn navigation — this is a planning/visualization tool
- Bathymetric (depth) data accuracy — decorative depth shading only
- Tide or lock scheduling — informational only

## Context

- Project scaffolded with Next.js 14+ (App Router), TypeScript, Tailwind CSS
- D3.js (d3-geo) for geographic projection and SVG path generation
- jsPDF for PDF export
- Vitest + React Testing Library for tests
- GeoJSON coastline data from Natural Earth or GSHHS (high-detail, 10m resolution)
- Navigation grid at ~1km resolution, rasterized from water polygons at build time
- Port database is a static JSON file — no backend needed
- Design doc at `docs/plans/2026-03-06-great-lakes-cruise-plotter-design.md`
- Implementation plan at `docs/plans/2026-03-06-great-lakes-cruise-plotter-implementation.md`

## Constraints

- **No backend**: Everything runs client-side — no API keys, no server, no database
- **Performance**: A* pathfinding must complete in <2 seconds for any route on the ~1km grid
- **Bundle size**: GeoJSON data should be <2MB to keep load times reasonable
- **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side A* over LLM routing | No API costs, works offline, deterministic results | — Pending |
| SVG over Canvas rendering | Native SVG export, easier nautical styling with patterns/filters | — Pending |
| Static port JSON over API | No backend needed, fast, simple | — Pending |
| Nautical chart style over Google Maps style | More distinctive, fits the maritime theme | — Pending |
| D3.js Albers projection | Good for mid-latitude regions, minimal distortion for Great Lakes | — Pending |

---
*Last updated: 2026-03-06 after initialization*
