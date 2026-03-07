# Phase 2: Map Visualization - Research

**Researched:** 2026-03-07
**Domain:** SVG map rendering with d3-geo + React, nautical chart styling
**Confidence:** HIGH

## Summary

Phase 2 renders a nautical-style SVG map of the Great Lakes using d3-geo for projection math and React JSX for SVG rendering. The existing codebase already has d3-geo v3.1.1 installed, TopoJSON coastline data (105 features, 73.5KB), and 86 curated ports with coordinates. The primary work is building a React component that projects GeoJSON features to SVG paths, adds nautical styling (parchment background, compass rose, depth shading, lat/lng graticule), and renders port markers with hover/selection interactivity.

The recommended approach uses `geoConicEqualArea` with Great Lakes-optimized parallels (42N/48N) and `fitSize` to auto-scale the projection to the SVG viewport. All geographic computation happens via d3-geo; all DOM rendering happens via React JSX -- no d3 DOM manipulation. This pattern is well-established, performant for ~105 features + 86 points, and keeps the SVG accessible for future route overlay (Phase 3) and export (Phase 5).

**Primary recommendation:** Use d3-geo `geoConicEqualArea` with `.parallels([42, 48]).rotate([84, 0]).fitSize()` for projection, render all SVG elements as React JSX, and structure the map as composable sub-components (coastlines, graticule, ports, compass rose, depth shading).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Parchment/cream background (#f5e6c8 range) -- classic nautical chart feel
- Water areas filled with light blue with subtle depth gradient shading (decorative only, not bathymetric)
- Coastlines rendered as dark lines with land fill in parchment tone
- Compass rose placed in an open water area (Lake Huron or Lake Superior has space)
- Lat/lng grid lines as subtle dashed lines with degree labels at edges
- Font choice: serif for labels (nautical tradition), clean sans-serif for UI controls
- All ~86 ports displayed as small circular markers on the map
- Default state: small dots with minimal visual weight so map isn't cluttered
- Selected/highlighted state: larger marker with label, distinct color (e.g., red or gold accent)
- Port labels shown on hover/selection only -- not all at once (too many for readability)
- Ports grouped visually by lake via subtle color coding or proximity
- Use d3-geo Albers Equal Area or Mercator projection optimized for Great Lakes bounding box
- Map fills the main content area -- full-width responsive SVG
- SVG rendered inline (not as image) for interactivity and future route overlay (Phase 3)
- d3-geo geoPath for rendering TopoJSON coastlines via topojson-client feature extraction
- React component wrapping an SVG element
- Use d3-geo for projection/path math, but render via React JSX (not d3 DOM manipulation)
- "use client" directive since map needs interactivity (hover, click for port selection)
- Load TopoJSON and port data at component mount, project to SVG coordinates

### Claude's Discretion
- Exact color palette values and opacity levels
- Compass rose design complexity (simple vs ornate)
- Depth shading gradient technique (CSS gradients vs SVG patterns)
- Port marker size and exact highlight animation
- Map padding and margin decisions
- Whether to use SVG filter effects for the parchment texture

### Deferred Ideas (OUT OF SCOPE)
- Route line rendering -- Phase 3 (VIZ-03)
- Click-to-drop-pin on map -- v2 (INT-01)
- Animated route drawing -- v2 (VIS-01)
- Multiple chart themes -- v2 (VIS-02)
- Print-optimized layout -- v2 (VIS-03)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZ-01 | Map rendered as nautical chart SVG (parchment background, compass rose, depth shading, lat/lng grid) | d3-geo geoPath + geoConicEqualArea projection renders coastlines; geoGraticule generates lat/lng grid; SVG defs/patterns for parchment texture and depth shading; compass rose as standalone SVG group |
| VIZ-02 | All ports displayed as markers; selected ports highlighted with labels | Port coordinates projected via projection function to SVG circle elements; React state manages selection; conditional rendering for labels and highlight styling |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-geo | 3.1.1 | Projection math, geoPath, geoGraticule | Already installed; standard for geographic SVG rendering |
| topojson-client | 3.1.0 | Convert TopoJSON to GeoJSON at runtime | Already installed; used by existing loadCoastlines() |
| React | 19.2.3 | SVG DOM rendering via JSX | Already installed; project framework |
| Next.js | 16.1.6 | App Router, "use client" components | Already installed; project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-geo-projection | 4.0.0 | Extended projections (already installed but not needed -- geoConicEqualArea is in d3-geo core) | Only if exotic projection needed |
| Tailwind CSS | 4.x | Layout utilities for map container | Container sizing, responsive breakpoints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| geoConicEqualArea | geoMercator | Mercator distorts area at Great Lakes latitudes; conic equal area preserves proportions for 42-49N range |
| geoConicEqualArea | geoAlbers | geoAlbers is US-centric preset; custom parallels [42,48] fit Great Lakes better than Albers defaults [29.5, 45.5] |
| React JSX SVG | d3 DOM manipulation | React JSX is idiomatic for Next.js, enables React state for interactivity, avoids ref/useEffect complexity |
| Inline SVG | Canvas | SVG needed for future export (Phase 5 EXP-01) and per-element interactivity |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
components/
  map/
    NauticalMap.tsx          # Main "use client" component, owns SVG + projection
    CoastlineLayer.tsx       # Renders GeoJSON features as <path> elements
    GraticuleLayer.tsx       # Renders lat/lng grid lines
    PortLayer.tsx            # Renders port markers (circles) with hover/selection
    CompassRose.tsx          # Static decorative compass rose SVG group
    DepthShading.tsx         # SVG defs: gradients/patterns for water depth effect
    MapDefs.tsx              # Shared SVG defs (filters, patterns, gradients)
    types.ts                 # Map-specific types (MapDimensions, PortMarkerState)
    use-map-projection.ts    # Hook: creates projection fitted to container size
    constants.ts             # Color palette, sizing constants
```

### Pattern 1: React JSX SVG Map with d3-geo Projection
**What:** Use d3-geo only for math (projection, path generation), render everything as React JSX SVG elements.
**When to use:** Always for this project -- idiomatic React, supports state-driven interactivity.
**Example:**
```typescript
// Source: d3js.org/d3-geo/path + d3js.org/d3-geo/projection + react-graph-gallery.com/map
"use client";
import { useMemo } from "react";
import { geoConicEqualArea, geoPath, geoGraticule } from "d3-geo";
import { loadCoastlines } from "@/lib/geo/load-geo";
import type { FeatureCollection } from "geojson";

interface MapProps {
  width: number;
  height: number;
  selectedPortIds: Set<string>;
  onPortSelect: (portId: string) => void;
}

export function NauticalMap({ width, height, selectedPortIds, onPortSelect }: MapProps) {
  const coastlines = useMemo(() => loadCoastlines(), []);
  const padding = 20;

  const projection = useMemo(() => {
    return geoConicEqualArea()
      .parallels([42, 48])
      .rotate([84, 0])
      .fitExtent([[padding, padding], [width - padding, height - padding]], coastlines);
  }, [width, height, coastlines]);

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const graticule = useMemo(() => {
    return geoGraticule()
      .extent([[-93, 41], [-75, 50]])
      .step([2, 2])();
  }, []);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* SVG defs for patterns, gradients */}
      {/* Background rect with parchment fill */}
      {/* Depth shading layer */}
      {/* Graticule lines */}
      <path d={pathGenerator(graticule)!} fill="none" stroke="#8b7355" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.3} />
      {/* Coastline paths */}
      {coastlines.features.map((feature, i) => (
        <path key={i} d={pathGenerator(feature)!} fill="#f5e6c8" stroke="#5c4a32" strokeWidth={0.8} />
      ))}
      {/* Port markers */}
      {/* Compass rose */}
    </svg>
  );
}
```

### Pattern 2: Projection Hook for Responsive Sizing
**What:** Encapsulate projection creation in a custom hook that recomputes on container resize.
**When to use:** Map must fill available space responsively.
**Example:**
```typescript
// Source: d3js.org/d3-geo/projection (fitExtent API)
import { useMemo } from "react";
import { geoConicEqualArea, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";

export function useMapProjection(width: number, height: number, data: FeatureCollection, padding = 20) {
  const projection = useMemo(() => {
    if (width === 0 || height === 0) return null;
    return geoConicEqualArea()
      .parallels([42, 48])
      .rotate([84, 0])
      .fitExtent([[padding, padding], [width - padding, height - padding]], data);
  }, [width, height, data, padding]);

  const path = useMemo(() => projection ? geoPath(projection) : null, [projection]);

  return { projection, path };
}
```

### Pattern 3: Port Projection with Hover/Selection State
**What:** Project port lat/lng to SVG coordinates, render as circles with React state for selection.
**When to use:** VIZ-02 port markers requirement.
**Example:**
```typescript
// Source: d3js.org/d3-geo/projection (projection function call)
import type { Port } from "@/lib/ports/types";
import type { GeoProjection } from "d3-geo";

interface PortLayerProps {
  ports: Port[];
  projection: GeoProjection;
  selectedIds: Set<string>;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function PortLayer({ ports, projection, selectedIds, hoveredId, onSelect, onHover }: PortLayerProps) {
  return (
    <g className="port-layer">
      {ports.map((port) => {
        const [x, y] = projection([port.lng, port.lat]) ?? [0, 0];
        const isSelected = selectedIds.has(port.id);
        const isHovered = hoveredId === port.id;
        const showLabel = isSelected || isHovered;
        return (
          <g key={port.id}>
            <circle
              cx={x} cy={y}
              r={isSelected ? 6 : 3}
              fill={isSelected ? "#c0392b" : "#5c4a32"}
              stroke={isSelected ? "#fff" : "none"}
              strokeWidth={isSelected ? 1.5 : 0}
              opacity={isSelected ? 1 : 0.6}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(port.id)}
              onMouseEnter={() => onHover(port.id)}
              onMouseLeave={() => onHover(null)}
            />
            {showLabel && (
              <text x={x + 8} y={y + 4} fontSize={11} fontFamily="Georgia, serif" fill="#3d2b1f">
                {port.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
```

### Anti-Patterns to Avoid
- **d3 DOM manipulation in React:** Never use `d3.select().append()` -- renders outside React's reconciliation, causes stale state and memory leaks. Use d3 for math only, React JSX for rendering.
- **Re-creating projection on every render:** Projection creation involves iterative fitting. Always wrap in useMemo with proper dependencies.
- **Rendering all 86 port labels simultaneously:** Creates visual clutter. Show labels only on hover/selection per user decision.
- **Using useEffect + ref for SVG:** Unnecessary complexity. Inline SVG JSX is simpler and more idiomatic in React 19.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geographic projection | Custom lat/lng to pixel math | d3-geo geoConicEqualArea + fitSize | Handles projection distortion, bounding, and scaling correctly |
| SVG path from GeoJSON | Manual coordinate string building | d3-geo geoPath | Handles polygons, multi-polygons, holes, antimeridian clipping |
| Lat/lng grid lines | Manual line coordinate calculation | d3-geo geoGraticule | Handles projection-aware curved lines, configurable step/extent |
| TopoJSON to GeoJSON | Custom parser | topojson-client feature() | Already working in loadCoastlines(), handles topology correctly |
| Responsive container | Manual resize listeners | CSS container + viewBox | SVG viewBox with width/height 100% handles responsive natively |

**Key insight:** d3-geo does the hard math (spherical geometry, projection fitting, path generation). React does the easy part (rendering SVG elements, managing state). Never mix their responsibilities.

## Common Pitfalls

### Pitfall 1: Coordinate Order Confusion
**What goes wrong:** d3-geo uses [longitude, latitude] but ports data has separate lat/lng fields. Swapping them places ports in the ocean or off-screen.
**Why it happens:** GeoJSON spec is [lng, lat] but human convention is "lat/lng".
**How to avoid:** Always project as `projection([port.lng, port.lat])`. Add a type-safe helper function.
**Warning signs:** Ports appearing clustered at wrong positions or outside the SVG bounds.

### Pitfall 2: Null Path from geoPath
**What goes wrong:** `geoPath(feature)` can return null for features outside the projection's clipping region.
**Why it happens:** Some coastline features may be partially outside the fitted viewport.
**How to avoid:** Always use the non-null assertion or null check: `d={pathGenerator(feature) ?? ""}`.
**Warning signs:** React warnings about null `d` attribute on `<path>` elements.

### Pitfall 3: Projection Recomputation Thrashing
**What goes wrong:** Projection recalculates on every render, causing jank.
**Why it happens:** Missing useMemo or incorrect dependency arrays.
**How to avoid:** Wrap projection and pathGenerator in useMemo with [width, height, data] dependencies.
**Warning signs:** Laggy map rendering, especially during resize.

### Pitfall 4: SVG Layering Order
**What goes wrong:** Port markers hidden behind coastline fills, or graticule lines drawn over port labels.
**Why it happens:** SVG renders in document order (no z-index). Later elements appear on top.
**How to avoid:** Render in order: background -> depth shading -> graticule -> coastlines -> ports -> compass rose -> labels.
**Warning signs:** Elements visually missing but present in DOM inspector.

### Pitfall 5: Land vs Water Fill Inversion
**What goes wrong:** Water areas filled with parchment color instead of blue (or vice versa).
**Why it happens:** TopoJSON features represent land masses (coastlines). The "water" is the negative space.
**How to avoid:** Fill the entire SVG background with water color first, then fill land features with parchment. The background rect IS the water.
**Warning signs:** Map looks inverted -- land is blue, lakes are tan.

### Pitfall 6: topojson-client Import in Client Component
**What goes wrong:** Build error or large bundle because topojson-client is imported in a "use client" component.
**Why it happens:** topojson-client works fine client-side but adds bundle weight.
**How to avoid:** loadCoastlines() already converts to GeoJSON. Call it once and pass the FeatureCollection as data. The conversion can happen at module level or in a parent component.
**Warning signs:** Larger than expected bundle size.

## Code Examples

### Graticule with Degree Labels
```typescript
// Source: d3js.org/d3-geo/shape (geoGraticule API)
import { geoGraticule } from "d3-geo";
import type { GeoProjection, GeoPath } from "d3-geo";

interface GraticuleLayerProps {
  projection: GeoProjection;
  path: GeoPath;
  extent: [[number, number], [number, number]]; // [[west, south], [east, north]]
  step: [number, number]; // [lng step, lat step]
}

export function GraticuleLayer({ projection, path, extent, step }: GraticuleLayerProps) {
  const graticule = geoGraticule().extent(extent).step(step)();
  const lines = geoGraticule().extent(extent).step(step).lines();

  return (
    <g className="graticule-layer">
      {/* Grid lines */}
      <path
        d={path(graticule) ?? ""}
        fill="none"
        stroke="#8b7355"
        strokeWidth={0.5}
        strokeDasharray="4,4"
        opacity={0.3}
      />
      {/* Degree labels at edges */}
      {lines.map((line, i) => {
        const coords = line.coordinates;
        const start = projection(coords[0] as [number, number]);
        if (!start) return null;
        // Determine if meridian (vertical) or parallel (horizontal)
        const isMeridian = coords[0][0] === coords[coords.length - 1][0];
        const label = isMeridian
          ? `${Math.abs(coords[0][0])}${coords[0][0] < 0 ? "W" : "E"}`
          : `${Math.abs(coords[0][1])}${coords[0][1] < 0 ? "S" : "N"}`;
        return (
          <text
            key={i}
            x={start[0]}
            y={start[1]}
            fontSize={9}
            fontFamily="Georgia, serif"
            fill="#8b7355"
            opacity={0.5}
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}
```

### Compass Rose (Simple Nautical Style)
```typescript
// Source: Custom SVG -- positioned in open water area
interface CompassRoseProps {
  x: number;
  y: number;
  size: number; // radius
}

export function CompassRose({ x, y, size }: CompassRoseProps) {
  const s = size;
  // Four cardinal points as triangular SVG paths
  return (
    <g transform={`translate(${x},${y})`} opacity={0.6}>
      {/* N pointer (dark) */}
      <polygon points={`0,${-s} ${-s * 0.15},0 ${s * 0.15},0`} fill="#3d2b1f" />
      {/* S pointer (light) */}
      <polygon points={`0,${s} ${-s * 0.15},0 ${s * 0.15},0`} fill="#b8a080" />
      {/* E pointer (light) */}
      <polygon points={`${s},0 0,${-s * 0.15} 0,${s * 0.15}`} fill="#b8a080" />
      {/* W pointer (dark) */}
      <polygon points={`${-s},0 0,${-s * 0.15} 0,${s * 0.15}`} fill="#3d2b1f" />
      {/* Cardinal labels */}
      <text y={-s - 4} textAnchor="middle" fontSize={10} fontFamily="Georgia, serif" fill="#3d2b1f">N</text>
      <text y={s + 12} textAnchor="middle" fontSize={10} fontFamily="Georgia, serif" fill="#3d2b1f">S</text>
      <text x={s + 6} dy={4} fontSize={10} fontFamily="Georgia, serif" fill="#3d2b1f">E</text>
      <text x={-s - 6} dy={4} textAnchor="end" fontSize={10} fontFamily="Georgia, serif" fill="#3d2b1f">W</text>
      {/* Outer circle */}
      <circle r={s * 1.2} fill="none" stroke="#8b7355" strokeWidth={0.5} />
    </g>
  );
}
```

### SVG Depth Shading with Radial Gradients
```typescript
// Source: SVG specification -- radialGradient for decorative depth effect
export function MapDefs() {
  return (
    <defs>
      {/* Parchment texture filter */}
      <filter id="parchment-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
        <feDiffuseLighting in="noise" lightingColor="#f5e6c8" surfaceScale="2" result="lit">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="lit" operator="multiply" />
      </filter>

      {/* Water depth gradient -- center of each lake slightly darker */}
      <radialGradient id="water-depth" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a8c8e0" />
        <stop offset="70%" stopColor="#c5dbe8" />
        <stop offset="100%" stopColor="#d4e6f0" />
      </radialGradient>

      {/* Selected port glow */}
      <filter id="port-glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
```

### Nautical Color Palette
```typescript
// Recommended color constants
export const NAUTICAL_COLORS = {
  // Background & land
  parchment: "#f5e6c8",
  parchmentDark: "#e8d5b0",
  land: "#f0ddb8",
  landStroke: "#5c4a32",

  // Water
  waterLight: "#d4e6f0",
  waterMid: "#c5dbe8",
  waterDeep: "#a8c8e0",

  // Graticule & decoration
  gridLine: "#8b7355",
  compassDark: "#3d2b1f",
  compassLight: "#b8a080",

  // Port markers
  portDefault: "#5c4a32",
  portSelected: "#c0392b",
  portHover: "#d4a017",
  portLabel: "#3d2b1f",

  // Text
  labelSerif: "Georgia, 'Times New Roman', serif",
  labelSans: "'Geist', sans-serif",
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| d3 DOM manipulation in React | d3 for math, React JSX for rendering | ~2020+ | Avoids ref complexity, plays well with React reconciliation |
| useEffect + d3.select for SVG | Direct JSX SVG elements with useMemo | React 18+ | Simpler code, better performance, no cleanup needed |
| react-simple-maps wrapper | Direct d3-geo + React JSX | Current | Fewer dependencies, full control, no wrapper overhead |
| geoAlbers US preset | geoConicEqualArea with custom parallels | Always available | Better fit for regional maps outside default Albers config |

**Deprecated/outdated:**
- `d3.select` for DOM in React: Works but fights React's rendering model. Only use d3 for computation.
- react-simple-maps: Useful for quick projects but adds abstraction layer. Direct d3-geo is simpler for custom styling like nautical charts.

## Open Questions

1. **Exact compass rose placement coordinates**
   - What we know: Lake Huron or Lake Superior has open water space for placement
   - What's unclear: Exact SVG coordinates depend on final projection fitting
   - Recommendation: Place at a hard-coded lat/lng position (e.g., center of Lake Superior ~[-87.5, 47.5]) and project to SVG coords. Adjust visually during implementation.

2. **Depth shading approach: per-lake or global**
   - What we know: User wants decorative depth gradient, not bathymetric accuracy
   - What's unclear: Whether to apply a single radial gradient to the whole water background or individual gradients per lake polygon
   - Recommendation: Use a single global gradient on the background rect (water = background). This is simpler and the decorative effect is achieved. Per-lake gradients would require identifying water polygons which don't exist in the TopoJSON (it contains land).

3. **Port label collision handling**
   - What we know: Labels shown only on hover/selection, so typically 0-5 visible at once
   - What's unclear: Whether labels will overlap when multiple nearby ports are selected
   - Recommendation: For v1, use simple offset positioning (label right of marker). Collision avoidance is premature complexity for hover-only labels.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-01 | Map renders SVG with nautical styling elements | unit | `npx vitest run components/map/__tests__/NauticalMap.test.tsx -x` | No -- Wave 0 |
| VIZ-01 | Projection correctly fits coastline data | unit | `npx vitest run components/map/__tests__/use-map-projection.test.ts -x` | No -- Wave 0 |
| VIZ-01 | Graticule renders with correct extent and step | unit | `npx vitest run components/map/__tests__/GraticuleLayer.test.tsx -x` | No -- Wave 0 |
| VIZ-02 | All 86 ports rendered as SVG circles | unit | `npx vitest run components/map/__tests__/PortLayer.test.tsx -x` | No -- Wave 0 |
| VIZ-02 | Selected ports show highlight styling and labels | unit | `npx vitest run components/map/__tests__/PortLayer.test.tsx -x` | No -- Wave 0 |
| VIZ-02 | Port hover shows label | unit | `npx vitest run components/map/__tests__/PortLayer.test.tsx -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `components/map/__tests__/NauticalMap.test.tsx` -- covers VIZ-01 (overall map structure, SVG presence, key layers)
- [ ] `components/map/__tests__/use-map-projection.test.ts` -- covers VIZ-01 (projection fitting, coordinate transformation)
- [ ] `components/map/__tests__/PortLayer.test.tsx` -- covers VIZ-02 (port rendering, selection, hover)
- [ ] `components/map/__tests__/GraticuleLayer.test.tsx` -- covers VIZ-01 (graticule rendering)

## Sources

### Primary (HIGH confidence)
- [d3js.org/d3-geo/projection](https://d3js.org/d3-geo/projection) - fitSize, fitExtent, projection configuration API
- [d3js.org/d3-geo/path](https://d3js.org/d3-geo/path) - geoPath API, SVG path generation, pointRadius
- [d3js.org/d3-geo/shape](https://d3js.org/d3-geo/shape) - geoGraticule API for lat/lng grid lines
- Local verification: d3-geo v3.1.1 geoConicEqualArea + fitSize tested against actual TopoJSON data with correct Great Lakes port coordinate projection

### Secondary (MEDIUM confidence)
- [react-graph-gallery.com/map](https://www.react-graph-gallery.com/map) - React + d3-geo rendering pattern (verified against d3 docs)
- [d3indepth.com/geographic](https://www.d3indepth.com/geographic/) - D3 geographic rendering reference
- [codefeetime.com/post/building-a-map-with-svg-and-react](https://www.codefeetime.com/post/building-a-map-with-svg-and-react/) - React SVG map architecture patterns

### Tertiary (LOW confidence)
- SVG filter effects for parchment texture (feTurbulence + feDiffuseLighting) -- standard SVG spec but rendering quality varies across browsers. May need fallback to solid color if performance is poor.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and verified working
- Architecture: HIGH - React JSX + d3-geo math pattern is well-documented and tested locally
- Projection: HIGH - geoConicEqualArea with parallels [42,48] verified against actual TopoJSON data, all test ports project correctly within 960x600 viewport
- Pitfalls: HIGH - well-known d3-geo + React integration issues documented across multiple sources
- Nautical styling: MEDIUM - SVG patterns and filters are standard SVG but exact aesthetic quality requires visual iteration

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- d3-geo v3 API unlikely to change)
