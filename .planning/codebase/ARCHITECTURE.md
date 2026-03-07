# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Next.js App Router single-page application (planned)

**Current State:** The project is freshly scaffolded via `create-next-app`. Only boilerplate code exists. The design documents in `docs/plans/` describe the target architecture in detail. This document captures both the current state and the planned architecture that implementation should follow.

**Key Characteristics:**
- Next.js 16 App Router with React 19 (server components by default)
- Client-side computation model: all pathfinding and map rendering happen in the browser
- No backend API routes, no database, no external services
- Static data (GeoJSON, port database) bundled as JSON imports
- D3.js for geo projection and SVG path generation
- Single-page app: one route (`/`) with sidebar + map layout

## Layers (Planned)

**Presentation Layer (React Components):**
- Purpose: UI rendering, user interaction, layout
- Location: `app/` (pages/layouts), `components/` (reusable UI)
- Contains: Page components, map renderer, destination picker, trip summary panel
- Depends on: Navigation engine, port database, D3 geo utilities
- Used by: Next.js App Router

**Navigation Engine (`lib/navigation/`):**
- Purpose: A* pathfinding on a pre-computed water grid
- Location: `lib/navigation/` (planned)
- Contains: Water grid data structure, A* pathfinder, route smoothing
- Depends on: Pre-computed water grid (rasterized from GeoJSON at build time)
- Used by: Presentation layer (map component triggers route computation)

**Geo/Map Data (`lib/geo/`):**
- Purpose: GeoJSON coastline data and D3 projection utilities
- Location: `lib/geo/` (planned)
- Contains: `great-lakes.json` (GeoJSON FeatureCollection), `load-geo.ts` (loader/parser)
- Depends on: Static GeoJSON data file
- Used by: Map renderer component, navigation grid generator

**Port Database (`lib/ports/`):**
- Purpose: Curated list of ~80-100 Great Lakes ports with search
- Location: `lib/ports/` (planned)
- Contains: `ports.json` (data), `ports.ts` (query functions)
- Depends on: Nothing (self-contained data module)
- Used by: Destination picker component, map renderer (port markers)

**Export Utilities (`lib/export/`):**
- Purpose: SVG/PNG/PDF export of the rendered map
- Location: `lib/export/` (planned)
- Contains: Export functions using jsPDF and canvas rendering
- Depends on: Rendered SVG DOM, jsPDF library
- Used by: Export button in UI

## Data Flow

**Route Planning Flow:**

1. User searches/selects ports in the Destination Picker sidebar component
2. Selected ports (ordered list) passed to the Navigation Engine
3. A* pathfinder chains waypoints between consecutive ports on the water grid
4. Waypoints smoothed into SVG path data
5. Map Renderer draws the route polyline over the nautical chart SVG
6. Trip Summary computes total distance (nautical miles) and estimated time

**Map Rendering Flow:**

1. `load-geo.ts` imports `great-lakes.json` and separates water/land features
2. D3 geo projection (`d3-geo`) transforms GeoJSON coordinates to SVG coordinates
3. SVG paths rendered for coastlines, islands, water areas
4. Nautical styling applied (depth gradients, grid lines, compass rose)
5. Port markers and route overlay rendered on top

**State Management:**
- React state (useState/useReducer) in the main page component
- Key state: selected ports list, computed route, speed setting, map viewport
- No global state management library planned
- Components marked `"use client"` for interactive features (map, picker, etc.)

## Key Abstractions

**Port:**
- Purpose: Represents a navigable destination on the Great Lakes
- Examples: `lib/ports/ports.ts` (planned)
- Pattern: TypeScript interface with id, name, lat, lng, lake, type, description

**Water Grid:**
- Purpose: Binary grid (~1km resolution) marking navigable vs. land cells
- Examples: `lib/navigation/` (planned)
- Pattern: Pre-computed at build time from GeoJSON, stored as compact binary/JSON artifact

**Route:**
- Purpose: Ordered list of waypoints forming a water-only path between ports
- Examples: `lib/navigation/` (planned)
- Pattern: A* output smoothed into SVG-compatible coordinate arrays

**GreatLakesGeo:**
- Purpose: Parsed GeoJSON split into water and land FeatureCollections
- Examples: `lib/geo/load-geo.ts` (planned)
- Pattern: Static import of JSON, filtered by feature properties

## Entry Points

**Application Entry:**
- Location: `app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Renders the full application UI (currently boilerplate, will become the cruise plotter)

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All page renders
- Responsibilities: HTML shell, font loading (Geist Sans/Mono), global CSS

**Build-Time Scripts (Planned):**
- Location: `scripts/prepare-geo.ts`, `scripts/generate-grid.ts` (planned)
- Triggers: npm scripts before build
- Responsibilities: Fetch/process GeoJSON, rasterize water grid

## Error Handling

**Strategy:** Not yet implemented. The planned architecture is client-side only, so error handling will focus on:
- Graceful fallbacks if GeoJSON fails to load
- Route-not-found handling when A* cannot find a water path
- Export error handling (canvas/PDF generation failures)

**Patterns:**
- React error boundaries for component-level failures (planned)
- Try/catch in pathfinding and export utilities (planned)

## Cross-Cutting Concerns

**Logging:** Console-based (no logging framework)
**Validation:** TypeScript strict mode enforces type safety at compile time
**Authentication:** Not applicable (no user accounts, fully client-side app)
**Styling:** Tailwind CSS v4 with PostCSS plugin, dark mode support via `prefers-color-scheme`
**Fonts:** Geist Sans and Geist Mono loaded via `next/font/google`

---

*Architecture analysis: 2026-03-06*
