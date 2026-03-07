# Roadmap: Great Lakes Cruise Plotter

## Overview

This roadmap delivers a client-side web application for plotting water-only cruise routes across the Great Lakes. The project progresses from geographic data processing through map rendering, pathfinding, route planning UI, and finally export capabilities. Each phase delivers a verifiable capability that builds on the previous, with the data foundation and navigation grid as the highest-risk work tackled first.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation** - Process coastline data, generate navigation grid, curate port database (completed 2026-03-07)
- [x] **Phase 2: Map Visualization** - Render nautical chart SVG with coastlines, port markers, and styling (completed 2026-03-07)
- [ ] **Phase 3: Pathfinding Engine** - Water-only A* routing with route display on map
- [x] **Phase 4: Route Planning UI** - Multi-stop trip builder with distance, time, and speed controls (completed 2026-03-07)
- [ ] **Phase 5: Export Pipeline** - SVG, PNG, and PDF export of completed maps

## Phase Details

### Phase 1: Data Foundation
**Goal**: Geographic data pipeline produces correct, optimized assets that all downstream features depend on
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. All 5 Great Lakes render with high-detail coastlines including major islands (Manitoulin, Apostle Islands, Isle Royale, etc.)
  2. Connecting waterways (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, upper St. Lawrence) are present and navigable in the grid
  3. User can search a curated port list and see ~80-100 Great Lakes ports with accurate coordinates
  4. TopoJSON coastline data is under 500KB and navigation grid loads in under 1 second
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Types, dependencies, and curated port database (DATA-03)
- [x] 01-02-PLAN.md — Geo processing pipeline and navigation grid generation (DATA-01, DATA-02)
- [x] 01-03-PLAN.md — Validation tests and integration verification (DATA-01, DATA-02, DATA-03)

### Phase 2: Map Visualization
**Goal**: Users see a beautiful nautical chart of the Great Lakes with all ports visible
**Depends on**: Phase 1
**Requirements**: VIZ-01, VIZ-02
**Success Criteria** (what must be TRUE):
  1. Map renders as SVG with nautical chart styling (parchment background, compass rose, decorative depth shading, lat/lng grid)
  2. All curated ports display as markers on the map with labels
  3. Selected ports are visually highlighted and distinguishable from unselected ports
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Nautical chart SVG core: projection, coastlines, graticule, compass rose, depth shading (VIZ-01)
- [x] 02-02-PLAN.md — Port markers with hover/selection and app page wiring (VIZ-02)

### Phase 3: Pathfinding Engine
**Goal**: The app can compute and display water-only routes between any two ports on the Great Lakes
**Depends on**: Phase 2
**Requirements**: ROUTE-01, VIZ-03
**Success Criteria** (what must be TRUE):
  1. Route between any two ports stays entirely on water (never crosses land)
  2. Route computes in under 2 seconds for any port pair, including cross-lake routes
  3. Route displays as a dashed line with directional indicators on the map
  4. Routes traverse connecting waterways correctly (e.g., Lake Superior to Lake Huron via St. Marys River)
**Plans:** 1/2 plans complete

Plans:
- [x] 03-01-PLAN.md — A* pathfinding engine with binary heap, path simplification, and waterway tests (ROUTE-01)
- [ ] 03-02-PLAN.md — RouteLayer SVG component and page wiring for route display (VIZ-03)

### Phase 4: Route Planning UI
**Goal**: Users can plan complete multi-stop cruise itineraries with full trip details
**Depends on**: Phase 3
**Requirements**: ROUTE-02, ROUTE-03, ROUTE-04
**Success Criteria** (what must be TRUE):
  1. User can add multiple stops and reorder them via drag-and-drop
  2. Trip summary shows total distance in nautical miles, estimated travel time, and per-leg breakdown
  3. User can adjust cruise speed in knots and travel time estimates update immediately
**Plans:** 2/2 plans complete

Plans:
- [ ] 04-01-PLAN.md — Multi-stop route builder with ordered stops, drag-to-reorder, distance utils, and side panel layout (ROUTE-02, ROUTE-03)
- [ ] 04-02-PLAN.md — Trip summary display, speed control slider, and full panel wiring with human verification (ROUTE-03, ROUTE-04)

### Phase 5: Export Pipeline
**Goal**: Users can save their completed cruise maps in multiple formats
**Depends on**: Phase 4
**Requirements**: EXP-01, EXP-02, EXP-03
**Success Criteria** (what must be TRUE):
  1. User can export the current map view as a downloadable SVG file
  2. User can export the current map view as a high-resolution PNG image
  3. User can export the current map view as a print-ready PDF document
  4. Exported files preserve nautical styling, route lines, port markers, and labels
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation | 3/3 | Complete   | 2026-03-07 |
| 2. Map Visualization | 2/2 | Complete   | 2026-03-07 |
| 3. Pathfinding Engine | 1/2 | In progress | - |
| 4. Route Planning UI | 2/2 | Complete   | 2026-03-07 |
| 5. Export Pipeline | 0/? | Not started | - |
