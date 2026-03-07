# Phase 4: Route Planning UI - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning
**Source:** Auto-generated from project context (--auto mode)

<domain>
## Phase Boundary

Multi-stop trip builder with drag-to-reorder stops, distance/time calculations, and adjustable cruise speed. Users plan complete cruise itineraries with per-leg and total trip summaries. Single route display already works (Phase 3) — this phase extends to N stops with full trip details.

Requirements: ROUTE-02 (multi-stop with drag-to-reorder), ROUTE-03 (distance/time/per-leg breakdown), ROUTE-04 (adjustable cruise speed)

</domain>

<decisions>
## Implementation Decisions

### Multi-Stop Route Builder
- Side panel UI showing ordered list of selected ports (stops)
- User adds stops by clicking ports on the map (existing click-to-select behavior)
- Drag-to-reorder stops in the side panel (HTML5 drag and drop or pointer events)
- Each stop shows port name and lake
- Remove stop via X button on each item
- Route automatically recomputes when stops change order or are added/removed

### Trip Summary Display
- Total trip distance in nautical miles displayed prominently
- Total estimated travel time based on cruise speed
- Per-leg breakdown table: From → To, distance (nm), estimated time
- Distances computed from A* path waypoints (sum of haversine distances between consecutive points)

### Cruise Speed Control
- Slider or input for cruise speed in knots
- Default: 10 knots (typical Great Lakes cruising speed)
- Range: 5-30 knots
- Travel time updates immediately when speed changes
- Time format: hours and minutes (e.g., "4h 32m")

### Layout
- Map takes primary space (left/center)
- Route planning panel on the right side
- Panel shows: ordered stop list, trip summary, speed control
- Responsive: panel collapses below map on narrow screens

### Claude's Discretion
- Exact drag-and-drop implementation (HTML5 vs pointer events)
- Panel width and breakpoint for collapse
- Typography and spacing in trip summary
- Whether to show intermediate waypoints or just stop-to-stop legs
- Animation during reorder

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/pathfinding/route.ts`: `findRoute(grid, portA, portB)` → PathResult with waypoints
- `lib/pathfinding/types.ts`: RoutePoint (lat, lng), PathResult
- `lib/ports/ports.ts`: getAllPorts(), getPortById(), searchPorts()
- `components/map/NauticalMap.tsx`: accepts routePoints prop, renders RouteLayer
- `components/map/PortLayer.tsx`: handles port selection state
- `app/page.tsx`: currently handles 2-port selection → route computation

### Established Patterns
- React state management via useState/useMemo (no external state lib)
- "use client" for interactive components
- Tailwind CSS for styling
- d3-geo for coordinate math

### Integration Points
- `app/page.tsx`: needs major refactor from 2-port selection to multi-stop management
- NauticalMap: needs to accept array of route segments instead of single routePoints
- RouteLayer: may need to render multiple connected segments
- New components: StopList, TripSummary, SpeedControl in a side panel

</code_context>

<specifics>
## Specific Ideas

- Multi-stop routing connects stops in order: A→B→C→D, computing each leg separately via findRoute
- The per-leg A* paths are concatenated for display but tracked separately for distance/time
- Nautical miles conversion: 1 degree latitude ≈ 60 nautical miles
- This is where the app becomes a "trip planner" vs just a "route viewer"

</specifics>

<deferred>
## Deferred Ideas

- Pre-built itineraries (e.g., "Lake Michigan Loop") — v2 (INT-03)
- Save/load routes via URLs — v2 (INT-02)
- Click on map to drop pins — v2 (INT-01)

</deferred>

---

*Phase: 04-route-planning-ui*
*Context gathered: 2026-03-07 via auto-mode*
