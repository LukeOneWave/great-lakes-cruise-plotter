---
phase: 04-route-planning-ui
plan: 01
subsystem: route-planning
tags: [multi-stop, drag-drop, distance, route-legs, side-panel]
dependency_graph:
  requires: [pathfinding-engine, port-data, map-visualization]
  provides: [multi-stop-state, route-legs, stop-reorder, stop-remove, distance-utils]
  affects: [app-layout, page-state]
tech_stack:
  added: []
  patterns: [HTML5-DnD, ordered-array-state, useMemo-route-computation]
key_files:
  created:
    - lib/pathfinding/distance.ts
    - lib/pathfinding/__tests__/distance.test.ts
    - components/route-planner/StopItem.tsx
    - components/route-planner/StopList.tsx
    - components/route-planner/RoutePlannerPanel.tsx
    - components/route-planner/__tests__/StopList.test.tsx
  modified:
    - lib/pathfinding/types.ts
    - app/page.tsx
decisions:
  - "RouteLeg type uses inline import() for Port to avoid circular deps"
  - "HTML5 native DnD over library -- zero dependencies, sufficient for ordered list"
  - "Distance test range corrected: 1 degree longitude at lat 45 is ~42.5nm (cos(45)*60), not 51.5nm"
metrics:
  duration: 3min
  completed: "2026-03-07T15:46:30Z"
---

# Phase 04 Plan 01: Multi-Stop Route Builder Summary

Multi-stop route builder with ordered stop management, drag-and-drop reordering, distance utilities, and responsive side panel layout.

## What Was Built

### Task 1: Distance utilities, RouteLeg type, and multi-stop page refactor (TDD)
- **computeDistanceNm**: Sums haversine distances along route points using d3-geo geoDistance, multiplied by Earth radius in nautical miles (3440.065)
- **formatTime**: Converts distance/speed to "Xh Ym" format with smart hour omission
- **RouteLeg interface**: Typed leg structure (from, to, path, distanceNm) for multi-leg routes
- **page.tsx refactor**: Replaced Set-based selection with ordered string[] array. Added reorderStops/removeStop callbacks. useMemo computes RouteLeg[] for consecutive stop pairs. Responsive flex layout with side panel area.

### Task 2: StopList with drag-and-drop and RoutePlannerPanel
- **StopItem**: Draggable item with HTML5 DnD (dragStart/dragOver/drop), visual drop indicator (blue border), drag handle, port info, remove button
- **StopList**: Renders ordered StopItems with numbered indices. Empty state ("Click ports on map") and single-stop state ("Add another stop") messages
- **RoutePlannerPanel**: Container with "Route Planner" header, renders StopList, placeholder slots for TripSummary and SpeedControl (Plan 02)
- **Tests**: 3 StopList tests (empty state, port rendering, remove callback)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected distance test expectation**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Plan specified ~51.5nm for 1 degree longitude at lat 45, but actual value is ~42.5nm (cos(45) * 60 = 42.43)
- **Fix:** Updated test range to 41-44nm
- **Files modified:** lib/pathfinding/__tests__/distance.test.ts
- **Commit:** de7c055

**2. [Rule 3 - Blocking] Created Task 2 components before Task 1 commit**
- **Found during:** Task 1
- **Issue:** page.tsx imports RoutePlannerPanel which doesn't exist yet, so build would fail at Task 1 commit boundary
- **Fix:** Created all route-planner components in same flow, committed Task 1 source files separately
- **Commit:** de7c055

**3. [Rule 3 - Blocking] Added jest-dom import for vitest**
- **Found during:** Task 2 test execution
- **Issue:** vitest setupFiles was empty, toBeInTheDocument matcher not available
- **Fix:** Added `import "@testing-library/jest-dom/vitest"` to test file
- **Commit:** 464150d

## Verification

- All 127 tests pass (npx vitest run)
- Build succeeds (npx next build)
- Distance utility tests: 6/6 passing
- StopList tests: 3/3 passing

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | de7c055 | Distance utilities, RouteLeg type, multi-stop page refactor |
| 2 | 464150d | StopList with drag-and-drop, RoutePlannerPanel, tests |
