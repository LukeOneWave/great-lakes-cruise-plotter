# Testing Patterns

**Analysis Date:** 2026-03-06

## Project State

Vitest is configured and testing libraries are installed, but **no test files exist yet**. This document describes the configured infrastructure and prescribes patterns for writing tests.

## Test Framework

**Runner:**
- Vitest 4.x
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`)
- `@testing-library/jest-dom` installed for DOM matchers (e.g., `toBeInTheDocument()`)

**React Testing:**
- `@testing-library/react` v16 installed
- JSDOM environment configured

**Run Commands:**
```bash
npm test                # Run all tests once (vitest run)
npm run test:watch      # Watch mode (vitest)
```

## Vitest Configuration

From `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
    globals: true,          // describe/it/expect available globally without import
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Key settings:**
- `globals: true` - No need to import `describe`, `it`, `expect` from vitest
- `environment: 'jsdom'` - DOM APIs available in all tests
- `@` alias resolves to project root, matching `tsconfig.json` paths
- `setupFiles: []` - No global setup file yet; create `vitest.setup.ts` if needed for `@testing-library/jest-dom` matchers

## Test File Organization

**Location:**
- No test files exist yet
- Co-locate tests next to source files (recommended for this project structure)

**Naming Convention (prescriptive):**
- `[filename].test.ts` for utility/logic tests
- `[filename].test.tsx` for component tests

**Recommended Structure:**
```
app/
  components/
    MapRenderer.tsx
    MapRenderer.test.tsx
  lib/
    pathfinding.ts
    pathfinding.test.ts
    ports.ts
    ports.test.ts
```

## Test Structure

**Suite Organization (prescriptive):**
```typescript
// No imports needed for describe/it/expect (globals: true)
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders the expected content', () => {
    render(<MyComponent />)
    expect(screen.getByText('expected text')).toBeInTheDocument()
  })
})
```

**For pure logic (pathfinding, distance calculations):**
```typescript
import { findPath } from './pathfinding'

describe('findPath', () => {
  it('returns empty array when start equals end', () => {
    const result = findPath(grid, { x: 0, y: 0 }, { x: 0, y: 0 })
    expect(result).toEqual([])
  })

  it('avoids land cells', () => {
    const result = findPath(gridWithLand, start, end)
    result.forEach(point => {
      expect(grid[point.y][point.x]).toBe(WATER)
    })
  })
})
```

## Mocking

**Framework:** Vitest built-in (`vi.fn()`, `vi.mock()`, `vi.spyOn()`)

**Patterns (prescriptive):**
```typescript
// Mock a module
vi.mock('@/app/lib/ports', () => ({
  getPorts: vi.fn(() => [
    { name: 'Chicago', lat: 41.88, lng: -87.63, lake: 'Michigan' }
  ])
}))

// Spy on a function
const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
// ... test code ...
expect(spy).not.toHaveBeenCalled()
spy.mockRestore()
```

**What to Mock:**
- Browser APIs not available in JSDOM (canvas for PNG export, blob URLs)
- `jsPDF` for PDF export tests
- Heavy computation (pre-computed grid data) - use small test fixtures

**What NOT to Mock:**
- Pure functions (pathfinding, distance calculation, coordinate transforms)
- React component rendering (use @testing-library/react instead)
- D3 geo projections (test with real projections for accuracy)

## Fixtures and Factories

**Test Data (prescriptive):**
```typescript
// Create small test grids for pathfinding tests
const createTestGrid = (rows: number, cols: number, landCells: [number, number][] = []) => {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(1)) // 1 = water
  landCells.forEach(([r, c]) => { grid[r][c] = 0 }) // 0 = land
  return grid
}

// Test port data
const testPorts = [
  { name: 'Port A', lat: 43.0, lng: -87.0, lake: 'Michigan', type: 'city' },
  { name: 'Port B', lat: 44.0, lng: -86.0, lake: 'Michigan', type: 'marina' },
]
```

**Location:**
- Small fixtures inline in test files
- Larger fixtures (GeoJSON snippets, grid data): create `__fixtures__/` directory adjacent to tests

## Coverage

**Requirements:** None enforced yet

**View Coverage:**
```bash
npx vitest run --coverage
```

**Note:** No coverage provider is installed. To enable, install `@vitest/coverage-v8`:
```bash
npm install -D @vitest/coverage-v8
```

## Test Types

**Unit Tests:**
- Primary focus for this project
- Test pathfinding algorithm with small grids
- Test distance/bearing calculations
- Test port search/filter logic
- Test coordinate transformations

**Component Tests:**
- Use `@testing-library/react` with JSDOM
- Test user interactions (search, add destination, reorder)
- Test rendering of map components (SVG output)

**Integration Tests:**
- Test full route calculation pipeline (port selection -> pathfinding -> distance summary)
- Not yet established

**E2E Tests:**
- No E2E framework installed (no Playwright/Cypress)

## Setup File

**Recommended:** Create `vitest.setup.ts` to extend matchers:
```typescript
import '@testing-library/jest-dom/vitest'
```

Then update `vitest.config.ts`:
```typescript
test: {
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.ts'],
  globals: true,
}
```

## Common Patterns

**Async Testing:**
```typescript
it('loads port data', async () => {
  const ports = await loadPorts()
  expect(ports).toHaveLength(80)
})
```

**Error Testing:**
```typescript
it('throws when no water path exists', () => {
  expect(() => findPath(allLandGrid, start, end)).toThrow('No navigable path')
})
```

**SVG/Canvas Testing:**
```typescript
it('renders SVG map with correct viewBox', () => {
  const { container } = render(<MapRenderer ports={[]} route={[]} />)
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('viewBox')
})
```

---

*Testing analysis: 2026-03-06*
