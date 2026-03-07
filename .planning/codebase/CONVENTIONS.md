# Coding Conventions

**Analysis Date:** 2026-03-06

## Project State

This is a freshly scaffolded Next.js 16 project using `create-next-app` defaults. The codebase contains only boilerplate files. Conventions below reflect the scaffolded defaults and planned architecture from `docs/plans/2026-03-06-great-lakes-cruise-plotter-design.md`.

## Naming Patterns

**Files:**
- React components/pages: `PascalCase` not observed yet; Next.js App Router uses lowercase route files (`page.tsx`, `layout.tsx`)
- Use kebab-case for non-route files and directories (Next.js App Router convention)
- Example: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`

**Functions:**
- React components: PascalCase (`RootLayout`, `Home`) - see `app/layout.tsx`, `app/page.tsx`
- Non-component functions: camelCase (not yet present, but follow TypeScript convention)

**Variables:**
- camelCase for all variables (`geistSans`, `geistMono`, `nextConfig`)
- CSS custom properties use `--kebab-case` (`--font-geist-sans`, `--color-background`)

**Types:**
- Use TypeScript `type` keyword for props: `type { Metadata }` import in `app/layout.tsx`
- Inline type annotations for component props with `Readonly<>` wrapper - see `app/layout.tsx` line 22

## Code Style

**Formatting:**
- No Prettier config file detected; relies on ESLint and editor defaults
- Double quotes for JSX string attributes and imports (see `app/layout.tsx`, `app/page.tsx`)
- 2-space indentation (observed in all source files)
- Trailing commas in multiline structures
- Semicolons at end of statements

**Linting:**
- ESLint 9 with flat config: `eslint.config.mjs`
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run with: `npm run lint`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- Target: ES2017
- Module resolution: bundler
- `isolatedModules: true`
- `noEmit: true` (Next.js handles compilation)

## Import Organization

**Order (observed in `app/layout.tsx`):**
1. Type imports from external packages (`import type { Metadata } from "next"`)
2. Named imports from external packages (`import { Geist, Geist_Mono } from "next/font/google"`)
3. Relative imports (`import "./globals.css"`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json` and `vitest.config.ts`)
- Use `@/app/...` or `@/lib/...` for absolute imports from project root

## Error Handling

**Patterns:**
- Not yet established in codebase
- Plan specifies client-side-only architecture (no API routes), so use try/catch in component logic
- For async operations (pathfinding, export), wrap in try/catch and surface errors in UI state

## Logging

**Framework:** console (no logging library installed)

**Patterns:**
- Use `console.error()` for errors during development
- No structured logging framework; this is a client-side-only app

## Comments

**When to Comment:**
- No comments observed in source files (boilerplate is self-documenting)
- Add comments for non-obvious algorithms (A* pathfinding, grid rasterization, geo projections)

**JSDoc/TSDoc:**
- Not yet used; add for utility functions and complex type definitions

## Function Design

**Size:** No established pattern yet; keep functions focused and under ~50 lines

**Parameters:**
- Use destructured props for React components with inline type annotation
- Example from `app/layout.tsx`:
```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
```

**Return Values:**
- React components return JSX directly
- Export components as default exports for page/layout files (Next.js convention)

## Module Design

**Exports:**
- Page and layout files use `export default` for the component
- Named exports for metadata: `export const metadata: Metadata = {...}` in `app/layout.tsx`
- Use named exports for utility functions and types

**Barrel Files:**
- Not used; import directly from source files

## CSS / Styling

**Framework:** Tailwind CSS v4 via PostCSS (`postcss.config.mjs`)

**Patterns:**
- Use Tailwind utility classes inline on JSX elements
- CSS custom properties defined in `app/globals.css` for theme colors
- Dark mode via `prefers-color-scheme` media query and Tailwind `dark:` prefix
- Custom fonts loaded via `next/font/google` and applied as CSS variables

**Global Styles:** `app/globals.css`
- Imports Tailwind with `@import "tailwindcss"`
- Defines CSS custom properties for `--background` and `--foreground`
- Uses `@theme inline` block for Tailwind theme integration

## React Patterns

**Component Style:**
- Function components only (no class components)
- Server Components by default (Next.js App Router)
- Add `"use client"` directive only when client-side interactivity is needed

**Props:**
- Inline type definitions with `Readonly<>` wrapper for immutability
- Destructure props in function signature

**State Management:**
- Not yet implemented; planned as client-side React state (no external state library in dependencies)

---

*Convention analysis: 2026-03-06*
