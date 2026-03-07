# Great Lakes Cruise Plotter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app that plots water-only cruise routes across the Great Lakes on a nautical chart-styled SVG map.

**Architecture:** Client-side A* pathfinding on a pre-computed water grid rasterized from GeoJSON coastline data. SVG map rendered via D3.js geo projection with nautical styling. Searchable port picker feeds destinations to the routing engine. Export to SVG/PNG/PDF.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, D3.js (d3-geo), jsPDF, Vitest

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `vitest.config.ts`

**Step 1: Initialize the project**

Run:
```bash
cd /Users/luke/great-lakes-cruise-plotter
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --yes
```

**Step 2: Install dependencies**

Run:
```bash
npm install d3-geo d3-geo-projection jspdf
npm install -D @types/d3-geo @types/d3-geo-projection vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 3: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Step 4: Add test script to package.json**

Add to `scripts`: `"test": "vitest run", "test:watch": "vitest"`

**Step 5: Verify setup**

Run:
```bash
npm run build
```
Expected: successful build

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, D3, Vitest"
```

---

### Task 2: Great Lakes GeoJSON Data

**Files:**
- Create: `lib/geo/great-lakes.json` (GeoJSON)
- Create: `lib/geo/load-geo.ts`
- Create: `lib/geo/__tests__/load-geo.test.ts`

**Step 1: Obtain and prepare GeoJSON**

Download or generate high-detail GeoJSON for the Great Lakes region. The GeoJSON should contain:
- Coastline polygons for all 5 Great Lakes
- Major islands (Manitoulin, Apostle Islands, Isle Royale, etc.)
- Connecting waterways as polygons (St. Marys River, Straits of Mackinac, St. Clair River/Lake, Detroit River, Welland Canal corridor, upper St. Lawrence)

Use Natural Earth 10m lakes + land data. Extract and clip to the Great Lakes bounding box: `[-92.5, 41.0, -75.5, 49.5]`.

Create a script `scripts/prepare-geo.ts` that:
1. Fetches Natural Earth 10m lakes GeoJSON (ne_10m_lakes) from a CDN
2. Filters to Great Lakes features (by name or scalerank)
3. Also fetches 10m land polygons and clips to bounding box
4. Outputs a single GeoJSON FeatureCollection to `lib/geo/great-lakes.json` with two feature types: `water` (lake polygons) and `land` (surrounding land)

Alternatively, manually curate a simplified but detailed GeoJSON. The file should be under 2MB for reasonable load times.

**Step 2: Write the geo loader module**

Create `lib/geo/load-geo.ts`:
```ts
import type { FeatureCollection } from 'geojson'
import geoData from './great-lakes.json'

export interface GreatLakesGeo {
  water: FeatureCollection
  land: FeatureCollection
}

export function loadGreatLakesGeo(): GreatLakesGeo {
  const fc = geoData as FeatureCollection
  const water = {
    type: 'FeatureCollection' as const,
    features: fc.features.filter(f => f.properties?.type === 'water'),
  }
  const land = {
    type: 'FeatureCollection' as const,
    features: fc.features.filter(f => f.properties?.type === 'land'),
  }
  return { water, land }
}
```

**Step 3: Write failing test**

Create `lib/geo/__tests__/load-geo.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { loadGreatLakesGeo } from '../load-geo'

describe('loadGreatLakesGeo', () => {
  it('returns water and land feature collections', () => {
    const geo = loadGreatLakesGeo()
    expect(geo.water.type).toBe('FeatureCollection')
    expect(geo.land.type).toBe('FeatureCollection')
    expect(geo.water.features.length).toBeGreaterThan(0)
    expect(geo.land.features.length).toBeGreaterThan(0)
  })

  it('water features cover all five Great Lakes', () => {
    const geo = loadGreatLakesGeo()
    const names = geo.water.features.map(f => f.properties?.name).filter(Boolean)
    for (const lake of ['Superior', 'Michigan', 'Huron', 'Erie', 'Ontario']) {
      expect(names.some(n => n.includes(lake))).toBe(true)
    }
  })
})
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run lib/geo/__tests__/load-geo.test.ts`
Expected: PASS (once GeoJSON is in place)

**Step 5: Commit**

```bash
git add lib/geo/ scripts/
git commit -m "feat: add Great Lakes GeoJSON data and loader"
```

---

### Task 3: Port Database

**Files:**
- Create: `lib/ports/ports.json`
- Create: `lib/ports/ports.ts`
- Create: `lib/ports/__tests__/ports.test.ts`

**Step 1: Write failing test**

Create `lib/ports/__tests__/ports.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getAllPorts, searchPorts, getPortsByLake, Port } from '../ports'

describe('ports', () => {
  it('has at least 50 ports', () => {
    expect(getAllPorts().length).toBeGreaterThanOrEqual(50)
  })

  it('every port has required fields', () => {
    for (const port of getAllPorts()) {
      expect(port.id).toBeTruthy()
      expect(port.name).toBeTruthy()
      expect(port.lat).toBeGreaterThan(40)
      expect(port.lat).toBeLessThan(50)
      expect(port.lng).toBeGreaterThan(-93)
      expect(port.lng).toBeLessThan(-75)
      expect(port.lake).toBeTruthy()
      expect(port.type).toBeTruthy()
    }
  })

  it('searchPorts filters by name substring', () => {
    const results = searchPorts('chic')
    expect(results.some(p => p.name === 'Chicago')).toBe(true)
  })

  it('getPortsByLake filters correctly', () => {
    const superiorPorts = getPortsByLake('Superior')
    expect(superiorPorts.length).toBeGreaterThan(0)
    expect(superiorPorts.every(p => p.lake === 'Superior')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ports/__tests__/ports.test.ts`
Expected: FAIL - module not found

**Step 3: Create port database JSON**

Create `lib/ports/ports.json` with ~80-100 ports. Include at minimum:

**Lake Superior:** Duluth MN, Two Harbors MN, Grand Marais MN, Isle Royale (Windigo), Isle Royale (Rock Harbor), Thunder Bay ON, Rossport ON, Marathon ON, Sault Ste. Marie MI/ON, Marquette MI, Munising MI, Copper Harbor MI, Houghton MI, Ashland WI, Bayfield WI, Apostle Islands

**Lake Michigan:** Chicago IL, Milwaukee WI, Green Bay WI, Sturgeon Bay WI, Manitowoc WI, Sheboygan WI, Door County (Sister Bay) WI, Traverse City MI, Charlevoix MI, Petoskey MI, Mackinaw City MI, Ludington MI, Muskegon MI, Holland MI, South Haven MI, St. Joseph MI, Gary IN, Michigan City IN

**Lake Huron:** Mackinac Island MI, Cheboygan MI, Alpena MI, Tawas City MI, Bay City MI, Port Huron MI, Goderich ON, Kincardine ON, Tobermory ON, Manitoulin Island ON, Killarney ON, Parry Sound ON, Midland ON

**Lake Erie:** Toledo OH, Sandusky OH, Put-in-Bay OH, Cleveland OH, Ashtabula OH, Erie PA, Buffalo NY, Port Colborne ON, Port Stanley ON, Pelee Island ON, Point Pelee ON

**Lake Ontario:** Toronto ON, Hamilton ON, Niagara-on-the-Lake ON, Rochester NY, Oswego NY, Sackets Harbor NY, Kingston ON, Thousand Islands (Alexandria Bay) NY, Cobourg ON, Prince Edward County ON

Each port entry:
```json
{
  "id": "chicago",
  "name": "Chicago",
  "lat": 41.8781,
  "lng": -87.6298,
  "lake": "Michigan",
  "type": "city_port",
  "description": "Major port on southwestern Lake Michigan"
}
```

Types: `city_port`, `marina`, `island`, `landmark`

**Step 4: Write implementation**

Create `lib/ports/ports.ts`:
```ts
import portsData from './ports.json'

export interface Port {
  id: string
  name: string
  lat: number
  lng: number
  lake: string
  type: 'city_port' | 'marina' | 'island' | 'landmark'
  description: string
}

const ports: Port[] = portsData as Port[]

export function getAllPorts(): Port[] {
  return ports
}

export function searchPorts(query: string): Port[] {
  const q = query.toLowerCase()
  return ports.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.lake.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  )
}

export function getPortsByLake(lake: string): Port[] {
  return ports.filter(p => p.lake === lake)
}

export function getPortById(id: string): Port | undefined {
  return ports.find(p => p.id === id)
}
```

**Step 5: Run tests**

Run: `npx vitest run lib/ports/__tests__/ports.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/ports/
git commit -m "feat: add curated port database with search"
```

---

### Task 4: Navigation Grid Generator

**Files:**
- Create: `lib/nav/grid.ts`
- Create: `lib/nav/__tests__/grid.test.ts`

**Step 1: Write failing test**

Create `lib/nav/__tests__/grid.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { NavigationGrid } from '../grid'
import { loadGreatLakesGeo } from '../../geo/load-geo'

describe('NavigationGrid', () => {
  it('creates a grid with correct dimensions', () => {
    const geo = loadGreatLakesGeo()
    const grid = new NavigationGrid(geo, 0.05) // ~5km resolution for fast tests
    expect(grid.width).toBeGreaterThan(0)
    expect(grid.height).toBeGreaterThan(0)
  })

  it('marks Chicago (water) as navigable', () => {
    const geo = loadGreatLakesGeo()
    const grid = new NavigationGrid(geo, 0.05)
    // Chicago harbor is at roughly 41.88, -87.61 - on Lake Michigan
    expect(grid.isWater(41.88, -87.61)).toBe(true)
  })

  it('marks land as non-navigable', () => {
    const geo = loadGreatLakesGeo()
    const grid = new NavigationGrid(geo, 0.05)
    // Madison WI is inland - 43.07, -89.40
    expect(grid.isWater(43.07, -89.40)).toBe(false)
  })

  it('converts between lat/lng and grid coords', () => {
    const geo = loadGreatLakesGeo()
    const grid = new NavigationGrid(geo, 0.05)
    const cell = grid.latLngToCell(43.0, -87.0)
    const back = grid.cellToLatLng(cell.row, cell.col)
    expect(Math.abs(back.lat - 43.0)).toBeLessThan(0.1)
    expect(Math.abs(back.lng - (-87.0))).toBeLessThan(0.1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/nav/__tests__/grid.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `lib/nav/grid.ts`:
```ts
import { geoContains } from 'd3-geo'
import type { GreatLakesGeo } from '../geo/load-geo'

// Bounding box for Great Lakes region
const BOUNDS = {
  minLat: 41.0,
  maxLat: 49.5,
  minLng: -92.5,
  maxLng: -75.5,
}

export class NavigationGrid {
  readonly width: number
  readonly height: number
  private cells: Uint8Array // 1 = water, 0 = land
  private resolution: number

  constructor(geo: GreatLakesGeo, resolution: number = 0.01) {
    this.resolution = resolution
    this.width = Math.ceil((BOUNDS.maxLng - BOUNDS.minLng) / resolution)
    this.height = Math.ceil((BOUNDS.maxLat - BOUNDS.minLat) / resolution)
    this.cells = new Uint8Array(this.width * this.height)
    this.rasterize(geo)
  }

  private rasterize(geo: GreatLakesGeo): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const lng = BOUNDS.minLng + col * this.resolution
        const lat = BOUNDS.maxLat - row * this.resolution
        // Check if point is inside any water feature
        const inWater = geo.water.features.some(f => geoContains(f, [lng, lat]))
        this.cells[row * this.width + col] = inWater ? 1 : 0
      }
    }
  }

  isWater(lat: number, lng: number): boolean {
    const cell = this.latLngToCell(lat, lng)
    if (cell.row < 0 || cell.row >= this.height || cell.col < 0 || cell.col >= this.width) {
      return false
    }
    return this.cells[cell.row * this.width + cell.col] === 1
  }

  isWaterCell(row: number, col: number): boolean {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return false
    }
    return this.cells[row * this.width + col] === 1
  }

  latLngToCell(lat: number, lng: number): { row: number; col: number } {
    const col = Math.round((lng - BOUNDS.minLng) / this.resolution)
    const row = Math.round((BOUNDS.maxLat - lat) / this.resolution)
    return { row, col }
  }

  cellToLatLng(row: number, col: number): { lat: number; lng: number } {
    return {
      lat: BOUNDS.maxLat - row * this.resolution,
      lng: BOUNDS.minLng + col * this.resolution,
    }
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run lib/nav/__tests__/grid.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/nav/
git commit -m "feat: add navigation grid rasterizer from GeoJSON"
```

---

### Task 5: A* Pathfinding Engine

**Files:**
- Create: `lib/nav/pathfinder.ts`
- Create: `lib/nav/__tests__/pathfinder.test.ts`

**Step 1: Write failing test**

Create `lib/nav/__tests__/pathfinder.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { findRoute, RouteResult } from '../pathfinder'
import { NavigationGrid } from '../grid'
import { loadGreatLakesGeo } from '../../geo/load-geo'

describe('findRoute', () => {
  let grid: NavigationGrid

  beforeAll(() => {
    const geo = loadGreatLakesGeo()
    grid = new NavigationGrid(geo, 0.05) // coarser for faster tests
  })

  it('finds a route between two ports on the same lake', () => {
    // Chicago to Milwaukee - both on Lake Michigan
    const result = findRoute(grid, [
      { lat: 41.88, lng: -87.61 },
      { lat: 43.03, lng: -87.91 },
    ])
    expect(result.success).toBe(true)
    expect(result.waypoints.length).toBeGreaterThan(2)
    expect(result.totalDistanceNm).toBeGreaterThan(0)
  })

  it('all waypoints are on water', () => {
    const result = findRoute(grid, [
      { lat: 41.88, lng: -87.61 },
      { lat: 43.03, lng: -87.91 },
    ])
    for (const wp of result.waypoints) {
      expect(grid.isWater(wp.lat, wp.lng)).toBe(true)
    }
  })

  it('handles multi-stop routes', () => {
    const result = findRoute(grid, [
      { lat: 41.88, lng: -87.61 },  // Chicago
      { lat: 43.03, lng: -87.91 },  // Milwaukee
      { lat: 44.76, lng: -85.62 },  // Traverse City
    ])
    expect(result.success).toBe(true)
    expect(result.legs.length).toBe(2)
  })

  it('returns failure for unreachable destinations', () => {
    const result = findRoute(grid, [
      { lat: 41.88, lng: -87.61 },  // Chicago
      { lat: 43.07, lng: -89.40 },  // Madison (inland!)
    ])
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run lib/nav/__tests__/pathfinder.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `lib/nav/pathfinder.ts`:
```ts
import { NavigationGrid } from './grid'

interface LatLng {
  lat: number
  lng: number
}

interface RouteLeg {
  from: LatLng
  to: LatLng
  waypoints: LatLng[]
  distanceNm: number
}

export interface RouteResult {
  success: boolean
  waypoints: LatLng[]
  legs: RouteLeg[]
  totalDistanceNm: number
  error?: string
}

const SQRT2 = Math.sqrt(2)
// 8 directions: N, NE, E, SE, S, SW, W, NW
const DIRS = [
  [-1, 0, 1], [-1, 1, SQRT2], [0, 1, 1], [1, 1, SQRT2],
  [1, 0, 1], [1, -1, SQRT2], [0, -1, 1], [-1, -1, SQRT2],
] as const

function heuristic(r1: number, c1: number, r2: number, c2: number): number {
  // Octile distance
  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)
  return Math.max(dr, dc) + (SQRT2 - 1) * Math.min(dr, dc)
}

function astar(
  grid: NavigationGrid,
  startRow: number, startCol: number,
  endRow: number, endCol: number,
): { row: number; col: number }[] | null {
  const key = (r: number, c: number) => r * grid.width + c

  const openSet = new Map<number, { row: number; col: number; g: number; f: number }>()
  const cameFrom = new Map<number, number>()
  const gScore = new Map<number, number>()

  const startKey = key(startRow, startCol)
  const endKey = key(endRow, endCol)
  const h0 = heuristic(startRow, startCol, endRow, endCol)

  openSet.set(startKey, { row: startRow, col: startCol, g: 0, f: h0 })
  gScore.set(startKey, 0)

  while (openSet.size > 0) {
    // Find node with lowest f
    let currentKey = -1
    let currentNode = null as any
    let bestF = Infinity
    for (const [k, node] of openSet) {
      if (node.f < bestF) {
        bestF = node.f
        currentKey = k
        currentNode = node
      }
    }

    if (currentKey === endKey) {
      // Reconstruct path
      const path: { row: number; col: number }[] = []
      let ck = currentKey
      while (ck !== undefined && ck !== -1) {
        const r = Math.floor(ck / grid.width)
        const c = ck % grid.width
        path.unshift({ row: r, col: c })
        ck = cameFrom.get(ck) as number
        if (ck === startKey) {
          path.unshift({ row: startRow, col: startCol })
          break
        }
      }
      return path
    }

    openSet.delete(currentKey)

    for (const [dr, dc, cost] of DIRS) {
      const nr = currentNode.row + dr
      const nc = currentNode.col + dc
      if (!grid.isWaterCell(nr, nc)) continue

      const nk = key(nr, nc)
      const tentG = currentNode.g + cost

      if (tentG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, currentKey)
        gScore.set(nk, tentG)
        const f = tentG + heuristic(nr, nc, endRow, endCol)
        openSet.set(nk, { row: nr, col: nc, g: tentG, f })
      }
    }
  }

  return null // No path found
}

// Approximate nautical miles per grid cell
function cellDistanceToNm(grid: NavigationGrid, cells: number): number {
  // 1 degree latitude ~ 60 nm
  // Grid resolution gives us degrees per cell
  // This is approximate but good enough
  const degreesPerCell = (49.5 - 41.0) / grid.height
  return cells * degreesPerCell * 60
}

function simplifyPath(path: { row: number; col: number }[]): { row: number; col: number }[] {
  if (path.length <= 2) return path
  // Douglas-Peucker-like simplification
  const tolerance = 2 // cells
  const result = [path[0]]
  let lastAdded = 0

  for (let i = 1; i < path.length - 1; i++) {
    const dx = path[i].col - path[lastAdded].col
    const dy = path[i].row - path[lastAdded].row
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist >= tolerance) {
      result.push(path[i])
      lastAdded = i
    }
  }

  result.push(path[path.length - 1])
  return result
}

function findNearestWaterCell(
  grid: NavigationGrid,
  lat: number,
  lng: number,
  maxRadius: number = 10
): { row: number; col: number } | null {
  const center = grid.latLngToCell(lat, lng)
  if (grid.isWaterCell(center.row, center.col)) return center

  for (let r = 1; r <= maxRadius; r++) {
    for (let dr = -r; dr <= r; dr++) {
      for (let dc = -r; dc <= r; dc++) {
        if (Math.abs(dr) !== r && Math.abs(dc) !== r) continue
        const nr = center.row + dr
        const nc = center.col + dc
        if (grid.isWaterCell(nr, nc)) return { row: nr, col: nc }
      }
    }
  }
  return null
}

export function findRoute(grid: NavigationGrid, stops: LatLng[]): RouteResult {
  if (stops.length < 2) {
    return { success: false, waypoints: [], legs: [], totalDistanceNm: 0, error: 'Need at least 2 stops' }
  }

  const legs: RouteLeg[] = []
  const allWaypoints: LatLng[] = []
  let totalDist = 0

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i]
    const to = stops[i + 1]

    const startCell = findNearestWaterCell(grid, from.lat, from.lng)
    const endCell = findNearestWaterCell(grid, to.lat, to.lng)

    if (!startCell || !endCell) {
      return {
        success: false, waypoints: [], legs: [], totalDistanceNm: 0,
        error: `Cannot find water near ${!startCell ? 'start' : 'end'} point`,
      }
    }

    const path = astar(grid, startCell.row, startCell.col, endCell.row, endCell.col)
    if (!path) {
      return {
        success: false, waypoints: [], legs: [], totalDistanceNm: 0,
        error: `No water route between stop ${i + 1} and ${i + 2}`,
      }
    }

    const simplified = simplifyPath(path)
    const waypoints = simplified.map(c => grid.cellToLatLng(c.row, c.col))

    // Calculate distance
    let legDist = 0
    for (let j = 1; j < path.length; j++) {
      const dr = path[j].row - path[j - 1].row
      const dc = path[j].col - path[j - 1].col
      legDist += Math.sqrt(dr * dr + dc * dc)
    }
    const distNm = cellDistanceToNm(grid, legDist)

    legs.push({ from, to, waypoints, distanceNm: distNm })
    totalDist += distNm

    if (i === 0) allWaypoints.push(...waypoints)
    else allWaypoints.push(...waypoints.slice(1))
  }

  return { success: true, waypoints: allWaypoints, legs, totalDistanceNm: totalDist }
}
```

Note: The A* uses a simple Map-based open set. For production performance with the ~1km grid, consider replacing with a proper priority queue (binary heap). The grid at 0.01 degree resolution is ~1700x850 cells, so A* should complete in under a second for typical routes.

**Step 4: Run tests**

Run: `npx vitest run lib/nav/__tests__/pathfinder.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/nav/
git commit -m "feat: add A* water-only pathfinding engine"
```

---

### Task 6: SVG Map Renderer Component

**Files:**
- Create: `components/MapRenderer.tsx`
- Create: `components/__tests__/MapRenderer.test.tsx`
- Create: `lib/geo/projection.ts`

**Step 1: Create geo projection utility**

Create `lib/geo/projection.ts`:
```ts
import { geoAlbers } from 'd3-geo'

// Great Lakes bounding box
const BOUNDS = {
  minLat: 41.0, maxLat: 49.5,
  minLng: -92.5, maxLng: -75.5,
}

export function createGreatLakesProjection(width: number, height: number) {
  const centerLng = (BOUNDS.minLng + BOUNDS.maxLng) / 2
  const centerLat = (BOUNDS.minLat + BOUNDS.maxLat) / 2

  return geoAlbers()
    .center([0, centerLat])
    .rotate([-centerLng, 0])
    .parallels([BOUNDS.minLat + 2, BOUNDS.maxLat - 2])
    .fitSize([width, height], {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [BOUNDS.minLng, BOUNDS.minLat],
            [BOUNDS.maxLng, BOUNDS.minLat],
            [BOUNDS.maxLng, BOUNDS.maxLat],
            [BOUNDS.minLng, BOUNDS.maxLat],
            [BOUNDS.minLng, BOUNDS.minLat],
          ]],
        },
      }],
    })
}
```

**Step 2: Create the MapRenderer component**

Create `components/MapRenderer.tsx`:
```tsx
'use client'

import { useMemo, useRef } from 'react'
import { geoPath } from 'd3-geo'
import { createGreatLakesProjection } from '@/lib/geo/projection'
import type { FeatureCollection } from 'geojson'
import type { Port } from '@/lib/ports/ports'

interface MapRendererProps {
  water: FeatureCollection
  land: FeatureCollection
  ports: Port[]
  selectedPorts: Port[]
  routeWaypoints: { lat: number; lng: number }[]
  width?: number
  height?: number
}

export default function MapRenderer({
  water, land, ports, selectedPorts, routeWaypoints,
  width = 900, height = 650,
}: MapRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const projection = useMemo(() => createGreatLakesProjection(width, height), [width, height])
  const pathGenerator = useMemo(() => geoPath(projection), [projection])

  // Build route SVG path from waypoints
  const routePath = useMemo(() => {
    if (routeWaypoints.length < 2) return ''
    const points = routeWaypoints
      .map(wp => projection([wp.lng, wp.lat]))
      .filter(Boolean) as [number, number][]
    if (points.length < 2) return ''
    return 'M ' + points.map(p => `${p[0]},${p[1]}`).join(' L ')
  }, [routeWaypoints, projection])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ background: '#f5f0e8' }}
    >
      <defs>
        {/* Water depth gradient */}
        <radialGradient id="waterGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4a90c4" />
          <stop offset="100%" stopColor="#2c5f8a" />
        </radialGradient>
        {/* Paper texture filter */}
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#f5f0e8" surfaceScale="2" result="light">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#f5f0e8" />

      {/* Lat/Lng grid lines */}
      {Array.from({ length: 10 }, (_, i) => 41 + i).map(lat => {
        const start = projection([-92.5, lat])
        const end = projection([-75.5, lat])
        if (!start || !end) return null
        return (
          <g key={`lat-${lat}`}>
            <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}
              stroke="#c4b89a" strokeWidth="0.5" strokeDasharray="4,4" opacity={0.5} />
            <text x={start[0] - 5} y={start[1]} fill="#8a7e6b" fontSize="8"
              textAnchor="end" dominantBaseline="middle">{lat}°N</text>
          </g>
        )
      })}
      {Array.from({ length: 18 }, (_, i) => -92 + i).map(lng => {
        const start = projection([lng, 41])
        const end = projection([lng, 49.5])
        if (!start || !end) return null
        return (
          <g key={`lng-${lng}`}>
            <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}
              stroke="#c4b89a" strokeWidth="0.5" strokeDasharray="4,4" opacity={0.5} />
            <text x={start[0]} y={end[1] - 5} fill="#8a7e6b" fontSize="8"
              textAnchor="middle">{Math.abs(lng)}°W</text>
          </g>
        )
      })}

      {/* Land */}
      {land.features.map((feature, i) => (
        <path key={`land-${i}`} d={pathGenerator(feature) || ''} fill="#d4c9a8" stroke="#b8a88a" strokeWidth="1" />
      ))}

      {/* Water */}
      {water.features.map((feature, i) => (
        <path key={`water-${i}`} d={pathGenerator(feature) || ''} fill="url(#waterGradient)" stroke="#2c5f8a" strokeWidth="0.5" />
      ))}

      {/* Route */}
      {routePath && (
        <>
          <path d={routePath} fill="none" stroke="#1a1a1a" strokeWidth="3" strokeDasharray="8,4"
            strokeLinecap="round" opacity={0.7} />
          <path d={routePath} fill="none" stroke="#d4423e" strokeWidth="1.5" strokeDasharray="8,4"
            strokeLinecap="round" />
        </>
      )}

      {/* All port markers (small dots) */}
      {ports.map(port => {
        const pos = projection([port.lng, port.lat])
        if (!pos) return null
        const isSelected = selectedPorts.some(sp => sp.id === port.id)
        return (
          <g key={port.id}>
            <circle cx={pos[0]} cy={pos[1]} r={isSelected ? 5 : 2.5}
              fill={isSelected ? '#d4423e' : '#5a4e3c'} stroke="#f5f0e8" strokeWidth="1" />
            {isSelected && (
              <text x={pos[0] + 8} y={pos[1] + 4} fill="#2c1810" fontSize="10"
                fontFamily="Georgia, serif" fontWeight="bold">{port.name}</text>
            )}
          </g>
        )
      })}

      {/* Compass Rose */}
      <g transform={`translate(${width - 70}, ${height - 70})`}>
        <circle r="30" fill="none" stroke="#8a7e6b" strokeWidth="1" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="#8a7e6b" strokeWidth="1" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke="#8a7e6b" strokeWidth="1" />
        <polygon points="0,-25 -4,-8 4,-8" fill="#2c1810" />
        <polygon points="0,25 -4,8 4,8" fill="#8a7e6b" />
        <text y="-32" textAnchor="middle" fill="#2c1810" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">N</text>
        <text y="40" textAnchor="middle" fill="#8a7e6b" fontSize="8" fontFamily="Georgia, serif">S</text>
        <text x="35" y="3" textAnchor="middle" fill="#8a7e6b" fontSize="8" fontFamily="Georgia, serif">E</text>
        <text x="-35" y="3" textAnchor="middle" fill="#8a7e6b" fontSize="8" fontFamily="Georgia, serif">W</text>
      </g>

      {/* Title Cartouche */}
      <g transform="translate(20, 20)">
        <rect width="220" height="40" rx="4" fill="#f5f0e8" stroke="#8a7e6b" strokeWidth="1.5" opacity={0.9} />
        <text x="110" y="26" textAnchor="middle" fill="#2c1810" fontSize="14"
          fontFamily="Georgia, serif" fontWeight="bold">Great Lakes Cruise Plotter</text>
      </g>
    </svg>
  )
}
```

**Step 3: Write basic render test**

Create `components/__tests__/MapRenderer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MapRenderer from '../MapRenderer'

const mockWater = { type: 'FeatureCollection' as const, features: [] }
const mockLand = { type: 'FeatureCollection' as const, features: [] }

describe('MapRenderer', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <MapRenderer water={mockWater} land={mockLand} ports={[]} selectedPorts={[]} routeWaypoints={[]} />
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders the title cartouche', () => {
    const { container } = render(
      <MapRenderer water={mockWater} land={mockLand} ports={[]} selectedPorts={[]} routeWaypoints={[]} />
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toContain('Great Lakes')
  })
})
```

**Step 4: Run tests**

Run: `npx vitest run components/__tests__/MapRenderer.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/ lib/geo/projection.ts
git commit -m "feat: add nautical chart SVG map renderer component"
```

---

### Task 7: Destination Picker Component

**Files:**
- Create: `components/DestinationPicker.tsx`
- Create: `components/__tests__/DestinationPicker.test.tsx`

**Step 1: Write failing test**

Create `components/__tests__/DestinationPicker.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import DestinationPicker from '../DestinationPicker'

const mockPorts = [
  { id: 'chicago', name: 'Chicago', lat: 41.88, lng: -87.63, lake: 'Michigan', type: 'city_port' as const, description: '' },
  { id: 'milwaukee', name: 'Milwaukee', lat: 43.03, lng: -87.91, lake: 'Michigan', type: 'city_port' as const, description: '' },
  { id: 'duluth', name: 'Duluth', lat: 46.79, lng: -92.10, lake: 'Superior', type: 'city_port' as const, description: '' },
]

describe('DestinationPicker', () => {
  it('renders search input', () => {
    render(<DestinationPicker ports={mockPorts} selectedPorts={[]} onSelectionChange={() => {}} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy()
  })

  it('filters ports when typing', () => {
    render(<DestinationPicker ports={mockPorts} selectedPorts={[]} onSelectionChange={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'chi' } })
    expect(screen.getByText('Chicago')).toBeTruthy()
    expect(screen.queryByText('Duluth')).toBeNull()
  })

  it('calls onSelectionChange when a port is added', () => {
    const onChange = vi.fn()
    render(<DestinationPicker ports={mockPorts} selectedPorts={[]} onSelectionChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'chi' } })
    fireEvent.click(screen.getByText('Chicago'))
    expect(onChange).toHaveBeenCalledWith([mockPorts[0]])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run components/__tests__/DestinationPicker.test.tsx`
Expected: FAIL

**Step 3: Write implementation**

Create `components/DestinationPicker.tsx`:
```tsx
'use client'

import { useState } from 'react'
import type { Port } from '@/lib/ports/ports'

interface DestinationPickerProps {
  ports: Port[]
  selectedPorts: Port[]
  onSelectionChange: (ports: Port[]) => void
}

export default function DestinationPicker({ ports, selectedPorts, onSelectionChange }: DestinationPickerProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = query.length > 0
    ? ports.filter(p =>
        !selectedPorts.some(sp => sp.id === p.id) &&
        (p.name.toLowerCase().includes(query.toLowerCase()) ||
         p.lake.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8)
    : []

  function addPort(port: Port) {
    onSelectionChange([...selectedPorts, port])
    setQuery('')
    setIsOpen(false)
  }

  function removePort(id: string) {
    onSelectionChange(selectedPorts.filter(p => p.id !== id))
  }

  function movePort(index: number, direction: -1 | 1) {
    const newPorts = [...selectedPorts]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= newPorts.length) return
    ;[newPorts[index], newPorts[newIndex]] = [newPorts[newIndex], newPorts[index]]
    onSelectionChange(newPorts)
  }

  const lakeColors: Record<string, string> = {
    Superior: '#1e40af',
    Michigan: '#1d4ed8',
    Huron: '#2563eb',
    Erie: '#3b82f6',
    Ontario: '#60a5fa',
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Search ports..."
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 border border-stone-300 rounded-md bg-stone-50 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-800 font-serif text-sm"
        />
        {isOpen && filtered.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-stone-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(port => (
              <li key={port.id}>
                <button
                  onClick={() => addPort(port)}
                  className="w-full px-3 py-2 text-left hover:bg-stone-100 flex items-center gap-2 text-sm"
                >
                  <span className="font-serif font-medium text-stone-800">{port.name}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: lakeColors[port.lake] || '#6b7280' }}
                  >{port.lake}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected ports list */}
      <div className="flex flex-col gap-1.5">
        {selectedPorts.map((port, i) => (
          <div key={port.id} className="flex items-center gap-2 px-2 py-1.5 bg-stone-100 rounded border border-stone-200">
            <span className="text-stone-400 font-mono text-xs w-4">{i + 1}.</span>
            <span className="flex-1 font-serif text-sm text-stone-800">{port.name}</span>
            <div className="flex gap-0.5">
              <button onClick={() => movePort(i, -1)} disabled={i === 0}
                className="text-stone-400 hover:text-stone-600 disabled:opacity-30 text-xs px-1">^</button>
              <button onClick={() => movePort(i, 1)} disabled={i === selectedPorts.length - 1}
                className="text-stone-400 hover:text-stone-600 disabled:opacity-30 text-xs px-1">v</button>
              <button onClick={() => removePort(port.id)}
                className="text-red-400 hover:text-red-600 text-xs px-1">x</button>
            </div>
          </div>
        ))}
      </div>

      {selectedPorts.length < 2 && (
        <p className="text-xs text-stone-400 italic font-serif">Add at least 2 ports to plot a route</p>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run components/__tests__/DestinationPicker.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/
git commit -m "feat: add destination picker with search and reorder"
```

---

### Task 8: Trip Summary Component

**Files:**
- Create: `components/TripSummary.tsx`
- Create: `components/__tests__/TripSummary.test.tsx`

**Step 1: Write failing test**

Create `components/__tests__/TripSummary.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TripSummary from '../TripSummary'

const mockLegs = [
  { from: { lat: 41.88, lng: -87.63 }, to: { lat: 43.03, lng: -87.91 }, waypoints: [], distanceNm: 85.3 },
  { from: { lat: 43.03, lng: -87.91 }, to: { lat: 44.76, lng: -85.62 }, waypoints: [], distanceNm: 162.7 },
]
const mockPortNames = ['Chicago', 'Milwaukee', 'Traverse City']

describe('TripSummary', () => {
  it('displays total distance', () => {
    render(<TripSummary legs={mockLegs} portNames={mockPortNames} totalDistanceNm={248} speedKnots={20} />)
    expect(screen.getByText(/248/)).toBeTruthy()
  })

  it('displays estimated travel time', () => {
    render(<TripSummary legs={mockLegs} portNames={mockPortNames} totalDistanceNm={248} speedKnots={20} />)
    // 248 / 20 = 12.4 hours
    expect(screen.getByText(/12/)).toBeTruthy()
  })

  it('allows speed adjustment', () => {
    const onSpeedChange = vi.fn()
    render(<TripSummary legs={mockLegs} portNames={mockPortNames} totalDistanceNm={248} speedKnots={20} onSpeedChange={onSpeedChange} />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '15' } })
    expect(onSpeedChange).toHaveBeenCalledWith(15)
  })
})
```

**Step 2: Run test to verify it fails**

**Step 3: Write implementation**

Create `components/TripSummary.tsx`:
```tsx
'use client'

interface Leg {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  waypoints: { lat: number; lng: number }[]
  distanceNm: number
}

interface TripSummaryProps {
  legs: Leg[]
  portNames: string[]
  totalDistanceNm: number
  speedKnots: number
  onSpeedChange?: (speed: number) => void
}

export default function TripSummary({ legs, portNames, totalDistanceNm, speedKnots, onSpeedChange }: TripSummaryProps) {
  const totalHours = totalDistanceNm / speedKnots
  const days = Math.floor(totalHours / 24)
  const hours = Math.round(totalHours % 24)

  return (
    <div className="flex flex-col gap-3 border-t border-stone-300 pt-3">
      <h3 className="font-serif font-bold text-stone-800 text-sm">Voyage Summary</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-stone-100 rounded p-2 text-center">
          <div className="text-lg font-bold text-blue-900 font-mono">{Math.round(totalDistanceNm)}</div>
          <div className="text-xs text-stone-500">nautical miles</div>
        </div>
        <div className="bg-stone-100 rounded p-2 text-center">
          <div className="text-lg font-bold text-blue-900 font-mono">
            {days > 0 ? `${days}d ${hours}h` : `${Math.round(totalHours)}h`}
          </div>
          <div className="text-xs text-stone-500">est. travel time</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="text-stone-500 text-xs whitespace-nowrap">Speed:</label>
        <input
          type="range" role="slider" min="5" max="40" step="1" value={speedKnots}
          onChange={e => onSpeedChange?.(Number(e.target.value))}
          className="flex-1 accent-blue-900"
        />
        <span className="text-stone-700 font-mono text-xs w-12">{speedKnots} kts</span>
      </div>

      {legs.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-xs text-stone-500 font-serif">Legs</h4>
          {legs.map((leg, i) => (
            <div key={i} className="flex justify-between text-xs text-stone-600 px-1">
              <span className="font-serif">{portNames[i]} → {portNames[i + 1]}</span>
              <span className="font-mono">{Math.round(leg.distanceNm)} nm</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run components/__tests__/TripSummary.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/
git commit -m "feat: add trip summary with speed control and leg breakdown"
```

---

### Task 9: Export Functionality

**Files:**
- Create: `lib/export/export.ts`
- Create: `lib/export/__tests__/export.test.ts`
- Create: `components/ExportButton.tsx`

**Step 1: Write failing test**

Create `lib/export/__tests__/export.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { svgToDataUrl, formatFilename } from '../export'

describe('export utilities', () => {
  it('converts SVG string to data URL', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    const url = svgToDataUrl(svg)
    expect(url).toContain('data:image/svg+xml')
  })

  it('generates a filename with date and stops', () => {
    const name = formatFilename(['Chicago', 'Milwaukee'], 'svg')
    expect(name).toMatch(/great-lakes-cruise.*chicago.*milwaukee.*\.svg/)
  })
})
```

**Step 2: Write implementation**

Create `lib/export/export.ts`:
```ts
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

export function formatFilename(stopNames: string[], extension: string): string {
  const stops = stopNames
    .slice(0, 3)
    .map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .join('-')
  const date = new Date().toISOString().slice(0, 10)
  return `great-lakes-cruise-${stops}-${date}.${extension}`
}

export async function exportSvg(svgElement: SVGSVGElement, stopNames: string[]): Promise<void> {
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  const url = svgToDataUrl(svgString)
  downloadUrl(url, formatFilename(stopNames, 'svg'))
}

export async function exportPng(svgElement: SVGSVGElement, stopNames: string[]): Promise<void> {
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = new Image()

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.naturalWidth * 2
      canvas.height = img.naturalHeight * 2
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          downloadUrl(url, formatFilename(stopNames, 'png'))
          URL.revokeObjectURL(url)
        }
        resolve()
      }, 'image/png')
    }
    img.src = svgToDataUrl(svgString)
  })
}

export async function exportPdf(svgElement: SVGSVGElement, stopNames: string[]): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = new Image()

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.naturalWidth * 2
      canvas.height = img.naturalHeight * 2
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(formatFilename(stopNames, 'pdf'))
      resolve()
    }
    img.src = svgToDataUrl(svgString)
  })
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
```

**Step 3: Create ExportButton component**

Create `components/ExportButton.tsx`:
```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { exportSvg, exportPng, exportPdf } from '@/lib/export/export'

interface ExportButtonProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  stopNames: string[]
  disabled?: boolean
}

export default function ExportButton({ svgRef, stopNames, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleExport(format: 'svg' | 'png' | 'pdf') {
    if (!svgRef.current) return
    setOpen(false)
    if (format === 'svg') await exportSvg(svgRef.current, stopNames)
    else if (format === 'png') await exportPng(svgRef.current, stopNames)
    else await exportPdf(svgRef.current, stopNames)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="px-3 py-1.5 bg-blue-900 text-white text-sm font-serif rounded hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-stone-300 rounded shadow-lg z-20">
          {(['svg', 'png', 'pdf'] as const).map(fmt => (
            <button key={fmt} onClick={() => handleExport(fmt)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-stone-100 text-stone-700">
              Export as {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run tests**

Run: `npx vitest run lib/export/__tests__/export.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/export/ components/ExportButton.tsx
git commit -m "feat: add SVG/PNG/PDF export functionality"
```

---

### Task 10: Wire Everything Together in Main Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Update globals.css with nautical font imports**

Add to `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');

:root {
  --font-serif: 'Playfair Display', Georgia, serif;
}
```

**Step 2: Update layout.tsx**

Update `app/layout.tsx` metadata title and description:
```tsx
export const metadata = {
  title: 'Great Lakes Cruise Plotter',
  description: 'Plot custom water cruise routes across the Great Lakes on a nautical chart map',
}
```

**Step 3: Build the main page**

Rewrite `app/page.tsx`:
```tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import MapRenderer from '@/components/MapRenderer'
import DestinationPicker from '@/components/DestinationPicker'
import TripSummary from '@/components/TripSummary'
import ExportButton from '@/components/ExportButton'
import { loadGreatLakesGeo } from '@/lib/geo/load-geo'
import { getAllPorts, Port } from '@/lib/ports/ports'
import { NavigationGrid } from '@/lib/nav/grid'
import { findRoute, RouteResult } from '@/lib/nav/pathfinder'

export default function Home() {
  const [selectedPorts, setSelectedPorts] = useState<Port[]>([])
  const [speedKnots, setSpeedKnots] = useState(20)
  const [isComputing, setIsComputing] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const geo = useMemo(() => loadGreatLakesGeo(), [])
  const allPorts = useMemo(() => getAllPorts(), [])
  const grid = useMemo(() => new NavigationGrid(geo, 0.01), [geo])

  function handleSelectionChange(ports: Port[]) {
    setSelectedPorts(ports)

    if (ports.length < 2) {
      setRouteResult(null)
      return
    }

    setIsComputing(true)
    // Defer to next tick so UI updates
    setTimeout(() => {
      const result = findRoute(
        grid,
        ports.map(p => ({ lat: p.lat, lng: p.lng }))
      )
      setRouteResult(result)
      setIsComputing(false)
    }, 10)
  }

  return (
    <main className="min-h-screen bg-stone-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
            Great Lakes Cruise Plotter
          </h1>
          <ExportButton
            svgRef={svgRef}
            stopNames={selectedPorts.map(p => p.name)}
            disabled={!routeResult?.success}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar */}
          <div className="w-full md:w-72 flex-shrink-0 bg-white rounded-lg shadow p-4 flex flex-col gap-4">
            <h2 className="font-serif font-bold text-stone-700 text-sm uppercase tracking-wide">Destinations</h2>
            <DestinationPicker
              ports={allPorts}
              selectedPorts={selectedPorts}
              onSelectionChange={handleSelectionChange}
            />

            {isComputing && (
              <p className="text-xs text-blue-700 italic font-serif">Plotting course...</p>
            )}

            {routeResult && !routeResult.success && (
              <p className="text-xs text-red-600 font-serif">{routeResult.error}</p>
            )}

            {routeResult?.success && (
              <TripSummary
                legs={routeResult.legs}
                portNames={selectedPorts.map(p => p.name)}
                totalDistanceNm={routeResult.totalDistanceNm}
                speedKnots={speedKnots}
                onSpeedChange={setSpeedKnots}
              />
            )}
          </div>

          {/* Map */}
          <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
            <MapRenderer
              ref={svgRef}
              water={geo.water}
              land={geo.land}
              ports={allPorts}
              selectedPorts={selectedPorts}
              routeWaypoints={routeResult?.waypoints || []}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
```

Note: The `MapRenderer` needs to forward the ref. Update it to use `forwardRef`:
```tsx
import { useMemo, forwardRef } from 'react'

const MapRenderer = forwardRef<SVGSVGElement, MapRendererProps>(function MapRenderer(
  { water, land, ports, selectedPorts, routeWaypoints, width = 900, height = 650 },
  ref
) {
  // ... same implementation but use ref instead of svgRef
  return <svg ref={ref} ... />
})
export default MapRenderer
```

**Step 4: Run the dev server and verify**

Run: `npm run dev`
Navigate to `http://localhost:3000` and verify:
- Map renders with nautical styling
- Port search works
- Route plots on water when 2+ ports selected
- Trip summary updates
- Export dropdown works

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add app/ components/MapRenderer.tsx
git commit -m "feat: wire up main page with routing, map, and sidebar"
```

---

### Task 11: Performance Optimization - Priority Queue for A*

**Files:**
- Create: `lib/nav/priority-queue.ts`
- Modify: `lib/nav/pathfinder.ts`
- Create: `lib/nav/__tests__/priority-queue.test.ts`

**Step 1: Write failing test**

Create `lib/nav/__tests__/priority-queue.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { MinHeap } from '../priority-queue'

describe('MinHeap', () => {
  it('pops elements in priority order', () => {
    const heap = new MinHeap<string>()
    heap.push('c', 3)
    heap.push('a', 1)
    heap.push('b', 2)
    expect(heap.pop()).toBe('a')
    expect(heap.pop()).toBe('b')
    expect(heap.pop()).toBe('c')
  })

  it('returns undefined when empty', () => {
    const heap = new MinHeap<string>()
    expect(heap.pop()).toBeUndefined()
  })

  it('tracks size correctly', () => {
    const heap = new MinHeap<string>()
    expect(heap.size).toBe(0)
    heap.push('a', 1)
    expect(heap.size).toBe(1)
    heap.pop()
    expect(heap.size).toBe(0)
  })
})
```

**Step 2: Write implementation**

Create `lib/nav/priority-queue.ts`:
```ts
export class MinHeap<T> {
  private heap: { value: T; priority: number }[] = []

  get size() { return this.heap.length }

  push(value: T, priority: number) {
    this.heap.push({ value, priority })
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.bubbleDown(0)
    }
    return top.value
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.heap[parent].priority <= this.heap[i].priority) break
      ;[this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]]
      i = parent
    }
  }

  private bubbleDown(i: number) {
    const n = this.heap.length
    while (true) {
      let smallest = i
      const left = 2 * i + 1
      const right = 2 * i + 2
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right
      if (smallest === i) break
      ;[this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]]
      i = smallest
    }
  }
}
```

**Step 3: Update pathfinder.ts A* to use MinHeap**

Replace the Map-based open set in the `astar` function with `MinHeap`. The open set iteration to find the minimum f-score node becomes an O(log n) heap pop instead of O(n) scan.

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: All PASS, pathfinding significantly faster for long routes

**Step 5: Commit**

```bash
git add lib/nav/
git commit -m "perf: replace A* open set with binary min-heap"
```

---

### Task 12: Final Polish and Build Verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All PASS

**Step 2: Run production build**

Run: `npm run build`
Expected: successful build with no errors

**Step 3: Test production build**

Run: `npm start`
Navigate to `http://localhost:3000` and verify all features work

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: final polish and build verification"
```
