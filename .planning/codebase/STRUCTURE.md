# Codebase Structure

**Analysis Date:** 2026-03-06

## Current State

This project is freshly scaffolded with `create-next-app`. Only boilerplate files exist. The implementation plan in `docs/plans/` defines the target structure. This document describes both the current layout and where new code should go.

## Directory Layout

```
great-lakes-cruise-plotter/
├── app/                    # Next.js App Router pages and layouts
│   ├── favicon.ico         # Site favicon
│   ├── globals.css         # Global styles (Tailwind import + CSS custom properties)
│   ├── layout.tsx          # Root layout (HTML shell, fonts, global CSS)
│   └── page.tsx            # Home page (currently boilerplate, will be main app)
├── docs/                   # Documentation
│   └── plans/              # Design and implementation plans
│       ├── 2026-03-06-great-lakes-cruise-plotter-design.md
│       └── 2026-03-06-great-lakes-cruise-plotter-implementation.md
├── public/                 # Static assets served at root
│   ├── file.svg            # Default Next.js icons (can be replaced)
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .planning/              # GSD planning artifacts
│   └── codebase/           # Codebase analysis documents
├── eslint.config.mjs       # ESLint config (next/core-web-vitals + typescript)
├── next.config.ts          # Next.js configuration (empty)
├── next-env.d.ts           # Next.js TypeScript declarations (auto-generated)
├── package.json            # Dependencies and scripts
├── package-lock.json       # Lockfile
├── postcss.config.mjs      # PostCSS config (Tailwind CSS plugin)
├── tsconfig.json           # TypeScript config (strict, path alias @/*)
├── vitest.config.ts        # Vitest test runner config (jsdom, React plugin)
└── README.md               # Project readme
```

## Planned Directory Layout

Per the implementation plan, the following directories will be created:

```
great-lakes-cruise-plotter/
├── app/                    # Next.js pages and layouts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Main application page
├── components/             # React UI components
│   ├── MapRenderer.tsx     # SVG nautical chart map
│   ├── DestinationPicker.tsx # Searchable port selector with drag-reorder
│   ├── TripSummary.tsx     # Distance/time breakdown panel
│   ├── CompassRose.tsx     # SVG compass rose decoration
│   └── ExportButton.tsx    # SVG/PNG/PDF export controls
├── lib/                    # Core business logic (non-React)
│   ├── geo/                # GeoJSON data and utilities
│   │   ├── great-lakes.json    # GeoJSON FeatureCollection (~2MB)
│   │   ├── load-geo.ts         # Loader that splits water/land features
│   │   └── __tests__/
│   │       └── load-geo.test.ts
│   ├── ports/              # Port database and search
│   │   ├── ports.json          # ~80-100 curated port entries
│   │   ├── ports.ts            # getAllPorts, searchPorts, getPortsByLake, getPortById
│   │   └── __tests__/
│   │       └── ports.test.ts
│   ├── navigation/         # Pathfinding engine
│   │   ├── water-grid.ts       # Grid data structure and cell lookup
│   │   ├── pathfinder.ts       # A* algorithm (8-directional, water-only)
│   │   ├── route.ts            # Multi-stop route chaining and smoothing
│   │   └── __tests__/
│   │       ├── pathfinder.test.ts
│   │       └── route.test.ts
│   └── export/             # Export utilities
│       ├── export-svg.ts       # SVG extraction
│       ├── export-png.ts       # SVG-to-canvas-to-PNG
│       └── export-pdf.ts       # jsPDF integration
├── scripts/                # Build-time data preparation scripts
│   ├── prepare-geo.ts          # Fetch/process GeoJSON from Natural Earth
│   └── generate-grid.ts       # Rasterize water grid from GeoJSON
├── public/                 # Static assets
├── docs/                   # Documentation
└── [config files]
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components (`.tsx`), CSS, layout wrappers
- Key files: `page.tsx` (main application entry), `layout.tsx` (root HTML/font setup)

**`components/` (planned):**
- Purpose: Reusable React UI components
- Contains: Client components (`"use client"`) for interactive features
- Key files: `MapRenderer.tsx`, `DestinationPicker.tsx`, `TripSummary.tsx`

**`lib/` (planned):**
- Purpose: Pure business logic, data modules, algorithms (framework-agnostic)
- Contains: TypeScript modules with no React dependencies
- Key subdirs: `geo/`, `ports/`, `navigation/`, `export/`

**`scripts/` (planned):**
- Purpose: Build-time data preparation scripts
- Contains: Node.js scripts for GeoJSON processing and grid generation
- Generated: Outputs go to `lib/geo/` and `lib/navigation/`

**`docs/`:**
- Purpose: Project documentation and planning artifacts
- Contains: Design specs, implementation plans
- Key files: `docs/plans/2026-03-06-great-lakes-cruise-plotter-design.md`, `docs/plans/2026-03-06-great-lakes-cruise-plotter-implementation.md`

**`public/`:**
- Purpose: Static assets served at URL root
- Contains: SVG icons, images (currently default Next.js assets)
- Will contain: Any static images needed for nautical chart decorations

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Main application page (the only route)
- `app/layout.tsx`: Root layout with fonts and global CSS

**Configuration:**
- `tsconfig.json`: TypeScript config (strict mode, `@/*` path alias)
- `next.config.ts`: Next.js config (currently empty)
- `vitest.config.ts`: Test runner config (jsdom environment, React plugin, `@` alias)
- `eslint.config.mjs`: ESLint with next/core-web-vitals and typescript rules
- `postcss.config.mjs`: PostCSS with Tailwind CSS v4 plugin

**Styling:**
- `app/globals.css`: Global CSS with Tailwind import and CSS custom properties for light/dark mode

**Design Documents:**
- `docs/plans/2026-03-06-great-lakes-cruise-plotter-design.md`: Architecture overview, UI layout, tech decisions
- `docs/plans/2026-03-06-great-lakes-cruise-plotter-implementation.md`: Step-by-step implementation plan with code examples

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `MapRenderer.tsx`, `DestinationPicker.tsx`)
- Modules/utilities: kebab-case (e.g., `load-geo.ts`, `water-grid.ts`)
- Data files: kebab-case (e.g., `great-lakes.json`, `ports.json`)
- Test files: `[module-name].test.ts` in `__tests__/` subdirectory
- Config files: lowercase with dots (e.g., `vitest.config.ts`, `next.config.ts`)

**Directories:**
- All lowercase, kebab-case for multi-word (e.g., `lib/navigation/`)
- Test directories: `__tests__/` (Jest/Vitest convention)

## Where to Add New Code

**New Page/Route:**
- Not applicable: this is a single-page app. All UI goes in `app/page.tsx` or extracted to `components/`.

**New React Component:**
- Place in: `components/[ComponentName].tsx`
- Must include `"use client"` directive if it uses hooks, event handlers, or browser APIs
- Import using: `@/components/ComponentName`

**New Business Logic Module:**
- Place in: `lib/[domain]/[module-name].ts`
- Tests: `lib/[domain]/__tests__/[module-name].test.ts`
- Keep framework-agnostic (no React imports in `lib/`)
- Import using: `@/lib/domain/module-name`

**New Data File (JSON):**
- Place in: `lib/[domain]/[data-name].json`
- Import directly in TypeScript via static import

**New Static Asset:**
- Place in: `public/[filename]`
- Reference via URL: `/filename`

**New Build Script:**
- Place in: `scripts/[script-name].ts`
- Add npm script in `package.json` to run it

**New Test:**
- Place in: `lib/[domain]/__tests__/[test-name].test.ts` for unit tests
- Place in: `components/__tests__/[ComponentName].test.tsx` for component tests
- Use Vitest with `describe`/`it`/`expect` pattern

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build` and `next dev`)
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD workflow planning artifacts and codebase analysis
- Generated: By GSD commands
- Committed: Up to project preference

**`node_modules/`:**
- Purpose: Installed npm packages
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

## Path Aliases

The `@/*` alias maps to the project root. Use it for all imports:

```typescript
import { getAllPorts } from '@/lib/ports/ports'
import { loadGreatLakesGeo } from '@/lib/geo/load-geo'
import MapRenderer from '@/components/MapRenderer'
```

Both `tsconfig.json` and `vitest.config.ts` configure this alias.

---

*Structure analysis: 2026-03-06*
