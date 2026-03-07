# Feature Landscape

**Domain:** Marine route planning / cruise map visualization (Great Lakes)
**Researched:** 2026-03-06

## Product Positioning

This application sits at the intersection of two product categories:

1. **Marine navigation apps** (Savvy Navvy, C-MAP, Orca, Aqua Map) -- real-time GPS-based routing tools for active boaters
2. **Custom cruise map keepsakes** (The Cruise Maps, Etsy sellers, Cunard custom maps) -- print-quality souvenirs of voyages

The Great Lakes Cruise Plotter is **neither** -- it is a **planning visualization tool** that generates beautiful, exportable route maps. This distinction is critical because it means we do NOT need real-time nav features (GPS, AIS, weather), but we DO need the visual quality of keepsake products and the route intelligence of navigation apps.

**Closest comparable:** Boatbookings route planner (multi-stop, distance/fuel calc, visual route) crossed with Printmaps.net (styled export-ready cartography).

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Searchable port list | Users need to find ports fast; typing "Mackinac" should work immediately | Low | Fuzzy search on ~80-100 ports. Autocomplete UI pattern. |
| Multi-stop route building | Core interaction model -- add stops, see route update | Medium | Drag-to-reorder, add/remove stops, live route preview |
| Water-only pathfinding | Routes crossing land destroy all credibility | High | A* on pre-computed nav grid. THE core technical challenge. |
| Route visualization on map | The entire value prop -- see your route on a map | Medium | SVG path overlay with styled line (dashed, colored, etc.) |
| All 5 Great Lakes coverage | Incomplete coverage = "doesn't work for my trip" | Medium | GeoJSON data sourcing + nav grid for full region |
| Connecting waterways | Many real cruises transit between lakes | High | St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal. Narrow channels need finer grid resolution. |
| Distance calculation (nm) | Every route planner shows distance. Expected. | Low | Sum of leg distances from pathfinding result |
| Travel time estimate | Boatbookings, Savvy Navvy, C-MAP all show ETA | Low | Distance / speed. Adjustable speed (knots) input. |
| Per-leg breakdown | Users plan multi-day trips and need leg-by-leg info | Low | Table showing each leg with distance, time, ports |
| Port markers on map | Users need to see where ports are to plan visually | Low | SVG circles/icons at port coordinates with labels |
| Map export (at least PNG) | Users want to save/share/print their route map | Medium | Canvas-based PNG export from SVG. Must be high-res. |
| Responsive layout | Users will share links on mobile even if desktop-primary | Medium | Map + sidebar layout that collapses on mobile |

---

## Differentiators

Features that set the product apart. Not expected, but create delight or competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Nautical chart styling | Parchment background, depth gradients, compass rose, lat/lng grid -- makes the map feel like a real chart, not Google Maps | High | SVG filters, patterns, careful design. This is the #1 visual differentiator. Keepsake maps on Etsy sell for $30-80 because they look beautiful. |
| SVG export | Vector-quality output for printing at any size. Most web map tools only export raster. | Low | Native SVG -- just serialize the DOM. Huge advantage over tile-based maps. |
| PDF export | Print-ready format with proper page sizing | Medium | jsPDF integration. Support common print sizes (8.5x11, A4, poster). |
| Compass rose | Classic nautical chart element. Strong visual identity. | Low | Static SVG element positioned on map. Pure aesthetics, high impact. |
| Depth shading (decorative) | Makes water areas visually interesting, not just flat blue | Medium | Gradient or pattern fill suggesting depth. NOT real bathymetric data -- decorative only. |
| No account required | Instant use, no friction. Most competitors require sign-up. | Zero | Stateless by design. Major UX advantage for casual users. |
| No backend / works offline | Once loaded, everything works client-side. No API rate limits, no downtime. | Zero | Architecture decision, not a feature to build. But worth highlighting. |
| Shareable URL with route encoded | Users can share a link that reconstructs their exact route | Medium | Encode port IDs + order in URL params or hash. No backend needed. |
| Custom cruise speed input | Different boats travel at different speeds (sailboat 6kts vs powerboat 20kts) | Low | Simple input field that recalculates all ETAs |
| Island rendering (major) | Manitoulin, Apostle Islands, Isle Royale -- these define Great Lakes geography | Medium | Requires high-detail GeoJSON. Routes must navigate around islands correctly. |
| Route animation | Animated "drawing" of the route on the map for visual delight | Low | SVG stroke-dashoffset animation. Simple to implement, high wow factor. |
| Print-optimized layout | Map reformatted for print with title, legend, trip summary in margins | High | Separate print layout that rearranges elements for paper output. Keepsake quality. |
| Dark/light map themes | Nautical chart (parchment) vs modern dark theme | Medium | CSS variables + SVG style switching. Appeals to different aesthetics. |

---

## Anti-Features

Features to explicitly NOT build. Each would add complexity without serving the core use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time GPS navigation | Requires native app, background location, battery management. Completely different product category. Savvy Navvy and C-MAP own this. | State clearly: "This is a planning tool, not a navigation tool." |
| Live weather/conditions | API dependency, ongoing costs, data freshness concerns. Breaks the "no backend" constraint. | Link to NOAA or weather.gov for the region. Informational only. |
| User accounts / saved routes | Adds backend complexity (auth, database, sessions). Kills the "instant use" advantage. | Use shareable URLs with route encoded. Browser localStorage for recent routes (optional). |
| Bathymetric accuracy | Real depth data is massive (hundreds of MB), requires specialized rendering, and creates liability concerns if anyone uses it for navigation. | Decorative depth shading only. Explicitly disclaim: "Not for navigation." |
| Tide/lock scheduling | Time-sensitive data requires live feeds. Welland Canal locks have complex schedules. | Mention that locks exist on the route but don't schedule them. |
| AIS / vessel tracking | Requires real-time data feeds, WebSocket connections, server infrastructure. | Out of scope entirely. Different product. |
| Turn-by-turn directions | "Turn starboard at buoy 47" -- requires navigational aid database, heading calculations. Not what this tool does. | Show route as a visual line with port stops. That's it. |
| Mobile native app | App store distribution, two codebases, review cycles. Web-first is the right call. | Responsive web app. Add to home screen via PWA if warranted later. |
| Social features / trip sharing feed | Community features require moderation, backend, user accounts. Feature creep. | Shareable URL is sufficient for v1. |
| GPX/KML import/export | Power user feature for chart plotter integration. Tiny audience for a visualization tool. | Could be a v2 feature if demand exists. SVG/PNG/PDF export covers the primary need. |
| Fuel cost calculator | Requires fuel price data, boat-specific consumption rates. Nice but unnecessary for a map visualization tool. | Show distance and time. Users can calculate fuel themselves. |

---

## Feature Dependencies

```
Searchable Port List -------> Multi-Stop Route Building
                                      |
                                      v
GeoJSON Coastline Data -----> Navigation Grid (rasterized)
                                      |
                                      v
                              A* Water-Only Pathfinding
                                      |
                              +-------+--------+
                              |                |
                              v                v
                     Route Visualization   Distance/Time Calc
                              |                |
                              v                v
                     Nautical Chart Styling  Per-Leg Breakdown
                              |
                     +--------+--------+
                     |        |        |
                     v        v        v
                  SVG Export PNG Export PDF Export
                                       |
                                       v
                              Print-Optimized Layout

Shareable URL (independent -- can be built anytime after route building)
Route Animation (independent -- can be added anytime after route visualization)
```

Key dependency chain: **GeoJSON data -> Nav grid -> A* pathfinding -> Route display -> Export**. This is the critical path. Everything else layers on top.

---

## MVP Recommendation

### Must ship (Phase 1):
1. **Searchable port list** with autocomplete (~80-100 Great Lakes ports)
2. **Multi-stop route builder** with add/remove/reorder
3. **A* water-only pathfinding** on pre-computed navigation grid
4. **Route visualization** on SVG map with basic styling
5. **All 5 Great Lakes + connecting waterways** in the nav grid
6. **Distance and time calculation** with adjustable speed
7. **PNG export** (simplest export format)

### Ship soon after (Phase 2):
8. **Nautical chart styling** (parchment, compass rose, depth shading, lat/lng grid)
9. **SVG and PDF export**
10. **Per-leg breakdown table**
11. **Port labels and markers** with good typography

### Defer:
- **Shareable URL**: Nice but not core. Add when route building is stable.
- **Route animation**: Polish feature. Add after core is solid.
- **Print-optimized layout**: Requires design iteration. Phase 3.
- **Dark/light themes**: Phase 3 or later.
- **localStorage recent routes**: Quality of life. Add when convenient.

### Rationale:
The critical path is clear: without pathfinding that avoids land, there is no product. Phase 1 is entirely about making the core route-planning loop work correctly. Phase 2 is about making it beautiful (the nautical styling IS the differentiator -- a route on a plain map is just Google Maps with extra steps). Phase 3 is polish and sharing features.

---

## Competitive Landscape Summary

| Competitor | Type | Strengths | Weakness (our opportunity) |
|------------|------|-----------|----------------------------|
| Savvy Navvy | Real-time nav app | Smart routing with weather/tides, large chart database | Requires account, subscription ($50+/yr), overkill for trip planning |
| C-MAP | Chart app | Professional-grade charts, autorouting | Complex UI, aimed at serious mariners, not casual planners |
| Boatbookings | Route planner | Multi-stop, distance/fuel calc | Focused on yacht charters, not Great Lakes, no beautiful export |
| The Cruise Maps | Keepsake prints | Beautiful printed maps, AIS-tracked routes | Manual order process, $50-100 per map, no self-service |
| Etsy sellers | Custom prints | Personalized, gift-worthy | Manual creation, days to deliver, no interactivity |
| MarineWays | Web planner | Browser-based, weather overlay | Generic styling, no Great Lakes focus |

**Our niche:** Self-service, instant, beautiful Great Lakes route maps. Free. No account. Export-ready. Nobody does this specific thing.

---

## Sources

- [Savvy Navvy](https://www.savvy-navvy.com/) - Navigation app feature set reference
- [C-MAP App](https://www.c-map.com/app/) - Chart app features and autorouting
- [The Cruise Maps](https://thecruisemaps.com/) - Custom cruise map keepsake product
- [Boatbookings Route Planner](https://www.boatbookings.com/yachting_content/map_distances.php) - Multi-stop route planning UX
- [Discover Boating - Best Marine Navigation Apps](https://www.discoverboating.com/resources/marine-navigation-apps) - Feature comparison across apps
- [Printmaps.net](https://www.printmaps.net/) - SVG/PDF map export capabilities
- [Great Lakes Scuttlebutt - Navigation Apps for Vacation Planning](https://www.greatlakesscuttlebutt.com/news/featured-news/how-to-use-your-navigation-apps-for-vacation-planning/) - Great Lakes-specific navigation context
- [Cruise Lowdown - Custom Cruise Maps](https://cruiselowdown.com/blog/Cruise-maps-memento) - Keepsake map market
- [Etsy Custom Cruise Maps](https://www.etsy.com/market/custom_cruise_map) - Custom map pricing and features
- [NavShip Boating](https://navship.org/en/home/) - Waterway route planning features
- [Orca Marine CoPilot](https://getorca.com/) - Modern chartplotter features
- [MarineWays](https://www.marineways.com/) - Web-based marine planning
