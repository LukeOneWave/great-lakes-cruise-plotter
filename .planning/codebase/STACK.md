# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript ^5 - All application code (`app/**/*.tsx`, config files)

**Secondary:**
- CSS - Styling via Tailwind CSS (`app/globals.css`)

## Runtime

**Environment:**
- Node.js v25.2.1

**Package Manager:**
- npm 11.7.0
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework, App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Testing:**
- Vitest ^4.0.18 - Test runner
- @testing-library/react ^16.3.2 - Component testing utilities
- @testing-library/jest-dom ^6.9.1 - DOM assertion matchers
- jsdom ^28.1.0 - Browser environment for tests

**Build/Dev:**
- TypeScript ^5 - Type checking (strict mode enabled)
- Tailwind CSS ^4 - Utility-first CSS framework
- @tailwindcss/postcss ^4 - PostCSS integration for Tailwind
- PostCSS - CSS processing (`postcss.config.mjs`)
- ESLint ^9 - Linting with `eslint-config-next` 16.1.6
- @vitejs/plugin-react ^5.1.4 - React support for Vitest

## Key Dependencies

**Critical:**
- d3-geo ^3.1.1 - Geographic projections and path generation for map rendering
- d3-geo-projection ^4.0.0 - Extended geographic projections (beyond d3-geo defaults)
- jspdf ^4.2.0 - PDF generation (for exporting cruise route maps)

**Infrastructure:**
- next ^16.1.6 - Application framework and server
- react ^19.2.3 - Component rendering

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Strict mode: enabled
- Module resolution: bundler
- Path alias: `@/*` maps to project root `./*`
- JSX: react-jsx

**Build:**
- `next.config.ts` - Next.js configuration (currently default/empty)
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `eslint.config.mjs` - ESLint with next core-web-vitals and typescript configs
- `vitest.config.ts` - Vitest with jsdom environment, React plugin, `@` path alias

**Environment:**
- No `.env` files present
- `.env*` patterns listed in `.gitignore`
- No environment variables currently required

## Scripts

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run Vitest (single run)
npm run test:watch # Run Vitest in watch mode
```

## Platform Requirements

**Development:**
- Node.js v25+ (v25.2.1 detected)
- npm 11+ (11.7.0 detected)

**Production:**
- Vercel (default Next.js deployment target, referenced in `.gitignore` and boilerplate)
- Any Node.js-compatible hosting

## Project State

This is a freshly scaffolded Next.js application (created via `create-next-app`). The `app/page.tsx` contains the default Next.js boilerplate template. The domain-specific dependencies (d3-geo, d3-geo-projection, jspdf) have been added but are not yet imported or used in any application code. Implementation plans exist in `docs/plans/`.

---

*Stack analysis: 2026-03-06*
