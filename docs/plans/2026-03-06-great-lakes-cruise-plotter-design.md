# Great Lakes Cruise Plotter - Design

## Overview

A Next.js web app that generates custom water cruise maps for the Great Lakes region. Users enter destinations from a searchable port list, and the app plots a water-only route on a nautical chart-styled SVG map using client-side A* pathfinding.

## Architecture

```
Next.js App
├── Map Renderer (SVG)
│   ├── High-detail GeoJSON coastlines -> SVG paths
│   ├── Nautical styling (compass rose, depth shading, lat/lng grid)
│   ├── Route polyline overlay with directional arrows
│   └── Port/marina markers with labels
├── Navigation Engine
│   ├── Pre-computed water grid (~1km resolution, rasterized from GeoJSON at build time)
│   ├── A* pathfinder (8-directional, multi-stop, water-only)
│   └── Connecting waterway corridors (manually defined navigable channels)
├── Destination Picker
│   ├── Searchable port list (~80-100 locations)
│   ├── Drag-to-reorder stops
│   └── Auto-complete grouped by lake/region
└── Trip Summary Panel
    ├── Total distance (nautical miles)
    ├── Estimated travel time (configurable speed in knots)
    ├── Per-leg breakdown
    └── Export (SVG / PNG / PDF)
```

## Key Technical Decisions

### Map Data
- Source: Natural Earth or GSHHS high-detail coastline data for the Great Lakes
- Includes islands (Manitoulin, Apostle Islands, Thousand Islands, etc.)
- All five Great Lakes plus connecting waterways (St. Marys River, Straits of Mackinac, Detroit/St. Clair River, Welland Canal, St. Lawrence)

### Navigation Grid
- Rasterize water area from GeoJSON into a ~1km resolution grid at build time
- Each cell: water (navigable) or land (blocked)
- Connecting waterways get manually defined corridors to ensure navigability
- Grid stored as a compact binary or JSON artifact

### Pathfinding
- A* algorithm with 8-directional movement on the water grid
- Multi-stop routes chain A* between consecutive ports
- Output waypoints smoothed into curved SVG paths
- Diagonal movement weighted at sqrt(2) for accurate distance

### Nautical Chart Styling
- Parchment/cream background with subtle paper texture
- Water depth gradient (lighter near shore, deeper blue in center)
- Compass rose SVG element
- Lat/lng grid lines with degree labels
- Dotted/dashed route line with directional arrows
- Port markers styled as anchor icons
- Decorative cartouche for title

### Port Database
- ~80-100 curated entries as a JSON file
- Fields: name, lat, lng, lake, type (city port / marina / island / landmark), description
- Covers all five lakes and connecting waterways

### Export
- SVG: native from the rendered map
- PNG: render SVG to canvas, then canvas.toBlob()
- PDF: jsPDF with SVG embedding

## UI Layout

```
┌──────────────────────────────────────────────────┐
│  Great Lakes Cruise Plotter              [Export] │
├─────────────┬────────────────────────────────────┤
│             │                                    │
│ Search...   │                                    │
│ ──────────  │      [Nautical SVG Map]            │
│ 1. Chicago  │                                    │
│ 2. Mackinac │      Route drawn on water          │
│ 3. Thunder  │      with distance labels          │
│    Bay      │                                    │
│             │         (compass rose)             │
│ [+ Add]     │                                    │
│             │                                    │
│ ──────────  │                                    │
│ Trip Info   │                                    │
│ 847 nm      │                                    │
│ ~42 hrs     │                                    │
│ @ 20 kts    │                                    │
└─────────────┴────────────────────────────────────┘
```

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- D3.js (for geo projection and SVG path generation)
- jsPDF (for PDF export)
- No external map tile services required
