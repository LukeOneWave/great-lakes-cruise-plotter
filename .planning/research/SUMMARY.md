# Research Summary: Great Lakes Cruise Plotter

**Domain:** Client-side marine route planning and cruise map visualization
**Researched:** 2026-03-06
**Overall confidence:** HIGH

## Executive Summary

The Great Lakes Cruise Plotter is a client-side web application that generates custom water cruise maps with A* pathfinding for water-only routes. The project sits in a unique niche: self-service, instant, beautiful route maps with no account required. No existing product combines the route intelligence of marine navigation apps with the visual quality of custom cruise map keepsakes.

The technology stack is well-chosen and largely already scaffolded: Next.js 16 with React 19, D3-geo for geographic projection and SVG path generation, TypeScript for type safety, and Tailwind for UI chrome. Three key additions are needed: **topojson-client** for efficient coastline data storage (80-85% smaller than GeoJSON), **svg2pdf.js** for vector-quality PDF export, and **d3-scale** for decorative depth gradients. Pathfinding should be custom-written A* (not a library) because the problem is simple enough (~100 lines), and the only viable library (PathFinding.js) is unmaintained for 10 years.

The critical technical challenge is the navigation grid: rasterizing GeoJSON water polygons into a binary grid that A* can traverse. The primary risk is narrow connecting waterways (St. Marys River, Detroit River, Welland Canal) being lost at ~1km grid resolution. This must be solved with manual corridor overrides and verified with automated cross-lake pathfinding tests. Secondary risks include coordinate system confusion (three systems coexist: [lng,lat], [row,col], [x,y]) and SVG performance with detailed coastlines.

The data pipeline is a build-time concern, not runtime: Natural Earth 10m data provides the right balance of coastline detail and file size. Converted to TopoJSON and clipped to the Great Lakes bounding box, the entire dataset should fit under 500KB. The navigation grid (~1.8M cells) fits in ~200KB as a compressed Uint8Array.

## Key Findings

**Stack:** Next.js 16 + React 19 + D3-geo + TypeScript + Tailwind (already scaffolded). Add topojson-client, svg2pdf.js, d3-scale. Custom A* pathfinding, not a library.

**Architecture:** Build-time data pipeline (GeoJSON -> TopoJSON + binary navigation grid) feeds a runtime architecture with React-owned SVG rendering, D3 used only as a math library (never DOM manipulation), and A* running in a Web Worker.

**Critical pitfall:** Narrow connecting waterways disappearing at 1km grid resolution. Must be solved with corridor overrides and validated with automated cross-lake tests.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Foundation** - Process GeoJSON, generate navigation grid, curate port database
   - Addresses: Coastline data, port database, navigation grid
   - Avoids: File size pitfall (TopoJSON), waterway starvation (corridor overrides), winding order issues (geojson-rewind)
   - Rationale: Everything downstream depends on correct, optimized geographic data. Grid generation is the highest-risk component and should be validated early.

2. **Core Map Rendering** - D3 Albers projection, SVG coastlines, port markers
   - Addresses: SVG map with all 5 lakes, port markers, basic styling
   - Avoids: D3/React DOM conflict (D3 as math only), SVG performance (simplified geometry), projection distortion (custom Albers parameters)
   - Rationale: Visual feedback is essential for validating that data is correct. Rendering the map lets you visually verify coastlines, islands, and port positions before building pathfinding.

3. **Pathfinding Engine** - Custom A*, Web Worker, route display
   - Addresses: Water-only routing, route visualization, distance/time calculation
   - Avoids: Main thread blocking (Web Worker), coordinate confusion (typed conversion module), island misclassification (visual overlay verification)
   - Rationale: The A* engine is the core value proposition. Building it after the map renderer enables visual debugging of routes against coastlines.

4. **Route Planning UI** - Port search, multi-stop builder, trip summary
   - Addresses: Searchable port list, multi-stop reorder, per-leg breakdown, speed adjustment
   - Avoids: No significant pitfalls; standard React UI patterns
   - Rationale: UI can only be built once the state shape is finalized (depends on routing output format).

5. **Nautical Styling and Polish** - Parchment aesthetic, compass rose, depth shading, grid lines
   - Addresses: Nautical chart styling, visual differentiators
   - Avoids: SVG performance with filters/patterns (keep styling simple for export compatibility)
   - Rationale: Styling is additive and independent of functionality. Build it last to avoid rework when the SVG structure changes.

6. **Export Pipeline** - SVG, PNG, PDF export
   - Addresses: All three export formats
   - Avoids: jsPDF SVG limitations (use svg2pdf.js for vectors, fallback to raster), tainted canvas (inline all resources), PNG quality (2x resolution)
   - Rationale: Export depends on finalized SVG structure and styling. Must be last because any SVG changes require re-testing exports.

**Phase ordering rationale:**
- Data must come first because grid generation is the highest-risk step and everything depends on it.
- Map rendering before pathfinding enables visual debugging (you can see if routes look wrong).
- Styling before export because export quality depends on knowing the final SVG structure.
- Each phase has a clear deliverable: Phase 1 = "we have correct data," Phase 2 = "we can see the lakes," Phase 3 = "we can route between ports," Phase 4 = "users can plan trips," Phase 5 = "it looks beautiful," Phase 6 = "users can save/share."

**Research flags for phases:**
- Phase 1 (Data): Likely needs deeper research on Natural Earth data filtering and TopoJSON simplification parameters. The connecting waterway corridor overrides need manual coordinate curation.
- Phase 3 (Pathfinding): May need research on Jump Point Search optimization if vanilla A* exceeds the 2-second target for long routes. Web Worker bundling with Next.js may have configuration nuances.
- Phase 6 (Export): svg2pdf.js feature support should be verified against the actual nautical styling elements chosen in Phase 5.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack already scaffolded and verified. Additional libraries (topojson-client, svg2pdf.js) are stable and well-documented. |
| Features | HIGH | Clear table stakes from project requirements. Competitive landscape well-understood. Anti-features clearly scoped by "no backend" constraint. |
| Architecture | HIGH | D3-as-math-library + React-owned-SVG is a well-established pattern. Build-time grid generation is standard geospatial practice. Web Worker for pathfinding is straightforward. |
| Pitfalls | HIGH | All critical pitfalls are well-documented in the geospatial/D3/pathfinding communities. Connecting waterway resolution is the most project-specific risk, but the mitigation (corridor overrides) is clear. |
| Data Sources | HIGH | Natural Earth 10m is the standard choice for this scale. TopoJSON compression ratios are well-documented. |

## Gaps to Address

- **Exact Natural Earth file selection:** Need to determine which specific NE files to download (ne_10m_lakes, ne_10m_land, ne_10m_coastline) and how they overlap/complement each other for the Great Lakes region.
- **Port database curation:** Need to compile the ~80-100 port list with accurate coordinates. No existing curated dataset found; this may require manual research.
- **Welland Canal navigability:** The Welland Canal is ~300m wide, well below 1km grid resolution. The corridor override approach needs specific coordinates for this waterway.
- **svg2pdf.js SVG feature matrix:** Need to verify which SVG features (filters, gradients, patterns) are supported by svg2pdf.js v2.5.0 before committing to nautical styling designs.
- **Web Worker bundling with Next.js 16:** The `new URL()` pattern for Web Workers works with webpack 5, but Next.js 16 configuration may have nuances. Test early.
- **Jump Point Search:** If vanilla A* is too slow for cross-system routes, JPS is a potential optimization, but implementation complexity is higher. Research if needed.
