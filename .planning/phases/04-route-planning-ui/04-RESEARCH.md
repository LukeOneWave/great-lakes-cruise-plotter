# Phase 4: Route Planning UI - Research

**Researched:** 2026-03-07
**Domain:** Multi-stop route planning UI, drag-and-drop reordering, distance/time calculations
**Confidence:** HIGH

## Summary

Phase 4 transforms the app from a 2-port route viewer into a full multi-stop trip planner. The current `page.tsx` manages a `Set<string>` of selected port IDs (max 2) and computes a single route. This must become an ordered array of stops with N-1 route legs computed independently via `findRoute()`, displayed in a right-side panel with drag-to-reorder, trip summary, and speed control.

The tech stack is already established: React 19 + Next.js 16 + Tailwind CSS + d3-geo. No new dependencies are needed. HTML5 Drag and Drop API is sufficient for the stop reordering (the list is simple, vertical-only, same-container). Distance calculations use the haversine formula on route waypoints, converting to nautical miles. All computation is client-side and synchronous.

**Primary recommendation:** Use HTML5 Drag and Drop for reordering, compute all legs via existing `findRoute()`, and derive distances/times with `useMemo` for instant reactivity to speed changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Side panel UI showing ordered list of selected ports (stops)
- User adds stops by clicking ports on the map (existing click-to-select behavior)
- Drag-to-reorder stops in the side panel (HTML5 drag and drop or pointer events)
- Each stop shows port name and lake
- Remove stop via X button on each item
- Route automatically recomputes when stops change order or are added/removed
- Total trip distance in nautical miles displayed prominently
- Total estimated travel time based on cruise speed
- Per-leg breakdown table: From -> To, distance (nm), estimated time
- Distances computed from A* path waypoints (sum of haversine distances between consecutive points)
- Slider or input for cruise speed in knots
- Default: 10 knots, Range: 5-30 knots
- Travel time updates immediately when speed changes
- Time format: hours and minutes (e.g., "4h 32m")
- Map takes primary space (left/center), route planning panel on the right side
- Responsive: panel collapses below map on narrow screens

### Claude's Discretion
- Exact drag-and-drop implementation (HTML5 vs pointer events)
- Panel width and breakpoint for collapse
- Typography and spacing in trip summary
- Whether to show intermediate waypoints or just stop-to-stop legs
- Animation during reorder

### Deferred Ideas (OUT OF SCOPE)
- Pre-built itineraries (e.g., "Lake Michigan Loop") -- v2 (INT-03)
- Save/load routes via URLs -- v2 (INT-02)
- Click on map to drop pins -- v2 (INT-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUTE-02 | User can plan multi-stop routes with drag-to-reorder | Ordered stop array + HTML5 DnD + findRoute per leg |
| ROUTE-03 | User sees trip distance (nm), estimated travel time, per-leg breakdown | Haversine on waypoints, speed-based time calc, TripSummary component |
| ROUTE-04 | User can adjust cruise speed (knots) to update travel time | Speed state + useMemo for instant recalculation |
</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI components | Already used |
| Next.js | 16.1.6 | App framework | Already used |
| Tailwind CSS | 4.x | Styling | Already used |
| d3-geo | 3.1.1 | Coordinate math (haversine) | Already used for projections |

### No New Dependencies Needed
The phase requires no new libraries. HTML5 Drag and Drop API is built into browsers. Distance math uses `d3-geo`'s `geoDistance()` which returns great-circle distance in radians (multiply by Earth radius in nm = 3440.065).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 DnD API | @dnd-kit/core | Smoother animations but adds dependency for a simple vertical list |
| HTML5 DnD API | Pointer events manual | More control but more code for same result |
| d3 geoDistance | Manual haversine | d3 already imported, no reason to hand-roll |

**Recommendation:** Use HTML5 Drag and Drop. The stop list is a simple vertical reorder within a single container -- HTML5 DnD handles this well. No library needed.

## Architecture Patterns

### Recommended Project Structure
```
components/
  route-planner/
    StopList.tsx          # Ordered stop list with drag-to-reorder + remove
    StopItem.tsx          # Individual stop row (draggable)
    TripSummary.tsx       # Per-leg breakdown table + totals
    SpeedControl.tsx      # Speed slider/input
    RoutePlannerPanel.tsx  # Container panel composing above
app/
  page.tsx               # Refactored: ordered stops array, multi-leg routing
```

### Pattern 1: Ordered Stops as Array (not Set)
**What:** Replace `Set<string>` with `string[]` for stop IDs to preserve insertion order and support reordering.
**When to use:** Always -- order matters for routes.
**Example:**
```typescript
const [stops, setStops] = useState<string[]>([]);

const handlePortSelect = useCallback((portId: string) => {
  setStops(prev => {
    if (prev.includes(portId)) {
      return prev.filter(id => id !== portId);
    }
    return [...prev, portId];
  });
}, []);

const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
  setStops(prev => {
    const next = [...prev];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  });
}, []);
```

### Pattern 2: Multi-Leg Route Computation
**What:** Compute N-1 route legs independently, memoize results.
**Example:**
```typescript
interface RouteLeg {
  from: Port;
  to: Port;
  path: PathResult | null;
  distanceNm: number;
}

const routeLegs = useMemo(() => {
  if (stops.length < 2) return [];
  return stops.slice(0, -1).map((fromId, i) => {
    const toId = stops[i + 1];
    const from = getPortById(fromId)!;
    const to = getPortById(toId)!;
    const path = findRoute(grid, fromId, toId);
    const distanceNm = path ? computeDistanceNm(path.points) : 0;
    return { from, to, path, distanceNm };
  });
}, [stops, grid]);
```

### Pattern 3: Distance Calculation with d3-geo
**What:** Sum haversine distances between consecutive waypoints using `geoDistance`.
**Example:**
```typescript
import { geoDistance } from "d3-geo";

const EARTH_RADIUS_NM = 3440.065;

function computeDistanceNm(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    // geoDistance takes [lng, lat] pairs, returns radians
    total += geoDistance(
      [points[i - 1].lng, points[i - 1].lat],
      [points[i].lng, points[i].lat]
    );
  }
  return total * EARTH_RADIUS_NM;
}
```

### Pattern 4: Speed-Based Time Calculation
**What:** Derive travel time from distance and speed, format as "Xh Ym".
**Example:**
```typescript
const [speedKnots, setSpeedKnots] = useState(10);

function formatTime(distanceNm: number, speedKnots: number): string {
  const hours = distanceNm / speedKnots;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
```

### Pattern 5: HTML5 Drag and Drop for Reorder
**What:** Minimal DnD using `draggable`, `onDragStart`, `onDragOver`, `onDrop`.
**Example:**
```typescript
function StopItem({ index, port, onReorder, onRemove }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    onReorder(fromIndex, index);
  };
  return (
    <div draggable onDragStart={handleDragStart}
         onDragOver={handleDragOver} onDrop={handleDrop}
         className="flex items-center gap-2 p-2 bg-white rounded border cursor-grab">
      <span className="text-neutral-400">&#x2630;</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{port.name}</div>
        <div className="text-xs text-neutral-500">{port.lake}</div>
      </div>
      <button onClick={() => onRemove(index)}
              className="text-neutral-400 hover:text-red-500 text-lg">&times;</button>
    </div>
  );
}
```

### Pattern 6: Responsive Side Panel
**What:** Flexbox layout with the panel on the right, collapsing below on narrow screens.
**Example:**
```typescript
// In page.tsx layout
<main className="flex flex-1 flex-col lg:flex-row">
  <div className="flex-1 min-h-[400px]">
    <NauticalMap ... />
  </div>
  <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white overflow-y-auto">
    <RoutePlannerPanel ... />
  </div>
</main>
```

### Anti-Patterns to Avoid
- **Computing all legs on every render:** Use `useMemo` keyed on `stops` array. Speed changes should NOT recompute routes -- only time display.
- **Storing computed distances in state:** Derive from route legs via `useMemo`. Single source of truth.
- **Using Set for ordered stops:** Sets don't preserve insertion order for reordering. Use array.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Great-circle distance | Manual haversine formula | `d3-geo geoDistance()` | Already imported, handles edge cases |
| Nautical mile conversion | Custom constants | `geoDistance() * 3440.065` | Standard Earth radius in nm |

## Common Pitfalls

### Pitfall 1: Route Recomputation on Speed Change
**What goes wrong:** Recomputing A* pathfinding when only speed changes.
**Why it happens:** Speed and stops in same dependency array.
**How to avoid:** Separate concerns -- `routeLegs` depends on `stops` only. Time display depends on `routeLegs` + `speedKnots`. Use two separate `useMemo` calls.

### Pitfall 2: NauticalMap Receiving Multiple Segments
**What goes wrong:** Current `NauticalMap` accepts `routePoints?: RoutePoint[]` (single segment). Multi-stop needs multiple segments displayed.
**How to avoid:** Change to accept `routeSegments: RoutePoint[][]` (array of arrays). RouteLayer renders all segments. Alternatively, flatten all points into one array (simpler, works if segments are connected end-to-end which they are since stops connect).

### Pitfall 3: Drag and Drop Visual Feedback
**What goes wrong:** No visual indication of where item will drop.
**How to avoid:** Add a CSS class on `dragOver` to show drop target indicator (border highlight or gap).

### Pitfall 4: Detroit River Grid Gap
**What goes wrong:** Some Huron-Erie legs return null from `findRoute` due to known grid connectivity gap.
**How to avoid:** Handle null PathResult gracefully -- show "No route found" for that leg, still allow the rest of the itinerary to work. Don't block the entire trip.

### Pitfall 5: Empty/Single Stop States
**What goes wrong:** UI breaks or shows confusing content with 0 or 1 stops.
**How to avoid:** Show helpful empty state ("Click ports on the map to add stops") and single-stop state ("Add another stop to see a route").

## Code Examples

### Concatenating Route Points for Map Display
```typescript
const allRoutePoints = useMemo(() => {
  return routeLegs.flatMap(leg => leg.path?.points ?? []);
}, [routeLegs]);
// Pass to NauticalMap as routePoints -- works since legs connect end-to-end
```

### Trip Summary Data
```typescript
const tripSummary = useMemo(() => {
  const totalDistanceNm = routeLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
  const totalTimeHours = totalDistanceNm / speedKnots;
  return {
    totalDistanceNm,
    totalTimeFormatted: formatTime(totalDistanceNm, speedKnots),
    legs: routeLegs.map(leg => ({
      from: leg.from.name,
      to: leg.to.name,
      distanceNm: leg.distanceNm,
      timeFormatted: formatTime(leg.distanceNm, speedKnots),
    })),
  };
}, [routeLegs, speedKnots]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Set-based port selection (2 max) | Ordered array of stops (N stops) | This phase | Core data model change |
| Single routePoints prop | Multiple legs or flattened points | This phase | Map component interface change |

## Open Questions

1. **Performance with many stops (10+)**
   - What we know: Each `findRoute` call takes ~50-200ms on the grid. 10 stops = 9 legs.
   - What's unclear: Whether 9 sequential A* calls cause noticeable UI lag.
   - Recommendation: Compute legs incrementally -- cache previous legs, only recompute changed pairs. For v1, sequential computation is likely fine (< 2s total).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | vitest.config.ts (assumed) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-02 | Multi-stop reorder: add, remove, reorder stops | unit | `npx vitest run components/route-planner/__tests__/ -x` | No - Wave 0 |
| ROUTE-03 | Distance/time calculation and display | unit | `npx vitest run lib/pathfinding/__tests__/distance.test.ts -x` | No - Wave 0 |
| ROUTE-04 | Speed control updates time immediately | unit | `npx vitest run components/route-planner/__tests__/SpeedControl.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `components/route-planner/__tests__/StopList.test.tsx` -- covers ROUTE-02 (add/remove/reorder)
- [ ] `lib/pathfinding/__tests__/distance.test.ts` -- covers ROUTE-03 (haversine nm calculation)
- [ ] `components/route-planner/__tests__/TripSummary.test.tsx` -- covers ROUTE-03 (display)
- [ ] `components/route-planner/__tests__/SpeedControl.test.tsx` -- covers ROUTE-04

## Sources

### Primary (HIGH confidence)
- Project codebase: `app/page.tsx`, `lib/pathfinding/types.ts`, `lib/pathfinding/route.ts`
- d3-geo `geoDistance` returns radians of great-circle distance -- standard API
- HTML5 Drag and Drop API -- browser built-in, well-documented

### Secondary (MEDIUM confidence)
- Earth radius in nautical miles: 3440.065 nm (standard geodetic constant)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing tech
- Architecture: HIGH - straightforward React state + memoization patterns
- Pitfalls: HIGH - based on actual codebase analysis (Detroit gap, Set vs array, NauticalMap interface)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable stack, no fast-moving dependencies)
