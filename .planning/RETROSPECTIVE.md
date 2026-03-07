# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-07
**Phases:** 5 | **Plans:** 11

### What Was Built
- Geographic data pipeline: TopoJSON coastlines (73.5KB), 850x425 navigation grid, 86 curated ports
- Nautical chart SVG with parchment styling, compass rose, depth shading, graticule
- Custom A* pathfinding engine with binary heap, octile heuristic, Douglas-Peucker simplification
- Multi-stop trip planner with drag-to-reorder, per-leg distance/time, adjustable cruise speed
- Export pipeline: SVG serialization, PNG via Canvas (2x), PDF via jsPDF

### What Worked
- Risk-first phase ordering: data foundation first caught grid resolution issues early
- TDD approach in pathfinding: tests caught waterway connectivity gaps before UI work
- Corridor override system: CW-wound polygons solved narrow waterway (Welland Canal) at 2km grid
- d3-geo for math only, React for rendering: clean separation, easy SVG export
- Inline SVG approach made export straightforward (serialize DOM node)

### What Was Inefficient
- ROADMAP.md plan checkboxes got out of sync with disk state across context resets
- Phase 3 checkbox never updated despite completion — manual tracking drift
- Some context window exhaustion required state saves and resumes

### Patterns Established
- Module-level static data imports (coastlines, grid) outside React lifecycle
- forwardRef pattern for exposing SVG elements to export functions
- Flat integer keys for grid lookups (row * width + col) — avoids string allocation
- Layer ordering convention in SVG: water bg -> defs -> graticule -> coastlines -> routes -> ports -> compass rose

### Key Lessons
- 0.02 degree grid (~2km) is the sweet spot for Great Lakes: fast generation, adequate pathfinding resolution
- CW winding is required for d3-geo spherical polygon containment (opposite of GeoJSON spec)
- Detroit River grid gap at St. Clair-Huron boundary is a known limitation — not an A* bug
- Port snap threshold of 80% at 0.02-deg grid is expected — findNearestWaterCell handles it

### Cost Observations
- Model mix: primarily sonnet for execution, opus for orchestration
- Sessions: ~4 sessions across context resets
- Notable: entire v1.0 built in single calendar day with autonomous execution

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 5 |
| Plans | 11 |
| LOC | 4,271 |
| Timeline | 1 day |
| Requirements delivered | 13/13 |
