# Requirements: Great Lakes Cruise Plotter

**Defined:** 2026-03-06
**Core Value:** Users can visually plan multi-stop boat routes across the Great Lakes that are guaranteed to stay on water, displayed on a beautiful nautical-style map.

## v1 Requirements

### Map Data

- [ ] **DATA-01**: User sees high-detail Great Lakes coastlines for all 5 lakes with major islands (via TopoJSON)
- [ ] **DATA-02**: User can route through connecting waterways (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, upper St. Lawrence)
- [ ] **DATA-03**: User can search and select from ~80-100 curated Great Lakes ports

### Routing

- [ ] **ROUTE-01**: App plots water-only routes using A* pathfinding (never crosses land)
- [ ] **ROUTE-02**: User can plan multi-stop routes with drag-to-reorder
- [ ] **ROUTE-03**: User sees trip distance (nautical miles), estimated travel time, and per-leg breakdown
- [ ] **ROUTE-04**: User can adjust cruise speed (knots) to update travel time estimate

### Visualization

- [ ] **VIZ-01**: Map rendered as nautical chart SVG (parchment background, compass rose, depth shading, lat/lng grid)
- [ ] **VIZ-02**: All ports displayed as markers; selected ports highlighted with labels
- [ ] **VIZ-03**: Route drawn as dashed line with directional indicators

### Export

- [ ] **EXP-01**: User can export map as SVG
- [ ] **EXP-02**: User can export map as high-res PNG
- [ ] **EXP-03**: User can export map as print-ready PDF (via SVG->Canvas->PNG->PDF pipeline)

## v2 Requirements

### Enhanced Interaction

- **INT-01**: User can click directly on map to drop pins
- **INT-02**: User can save/load routes via shareable URLs
- **INT-03**: User can choose from pre-built itineraries (e.g., "Lake Michigan Loop")

### Visual Enhancements

- **VIS-01**: Animated route drawing
- **VIS-02**: Multiple nautical chart themes/color schemes
- **VIS-03**: Print-optimized layout with legend and trip details

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time weather/conditions | API dependency, different product category |
| GPS/turn-by-turn navigation | This is a planning/visualization tool, not a nav app |
| User accounts/saved routes | Keep stateless for v1 simplicity |
| Bathymetric accuracy | Depth shading is decorative only |
| Tide/lock scheduling | Would require external data sources |
| AIS vessel tracking | Different product entirely |
| Mobile native app | Web-first, responsive design sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| ROUTE-01 | TBD | Pending |
| ROUTE-02 | TBD | Pending |
| ROUTE-03 | TBD | Pending |
| ROUTE-04 | TBD | Pending |
| VIZ-01 | TBD | Pending |
| VIZ-02 | TBD | Pending |
| VIZ-03 | TBD | Pending |
| EXP-01 | TBD | Pending |
| EXP-02 | TBD | Pending |
| EXP-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after initial definition*
