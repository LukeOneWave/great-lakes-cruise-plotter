# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**None currently integrated.**

The application is a client-side map plotting tool with no external API dependencies at this time. All planned functionality (map rendering, route plotting, PDF export) runs entirely in the browser.

## Data Storage

**Databases:**
- None - This is a client-side-only application

**File Storage:**
- Local filesystem only (static assets in `public/`)
- PDF export via jspdf generates files client-side for download

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None - No authentication required

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Console only (default Next.js logging)

## CI/CD & Deployment

**Hosting:**
- Vercel (implied by Next.js scaffold, `.vercel` in `.gitignore`)
- No deployment configuration files present

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars:**
- None currently required

**Secrets location:**
- Not applicable

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Client-Side Libraries (Integration-Adjacent)

These libraries handle data processing entirely in the browser:

**d3-geo / d3-geo-projection:**
- Purpose: Geographic map projections and SVG path generation
- No external API calls - works with local GeoJSON data
- Types: `@types/d3-geo` installed

**jspdf:**
- Purpose: Client-side PDF generation for exporting cruise route maps
- No external API calls - renders PDF entirely in browser

## Fonts

**Google Fonts (via Next.js):**
- Geist Sans - loaded via `next/font/google` in `app/layout.tsx`
- Geist Mono - loaded via `next/font/google` in `app/layout.tsx`
- These are optimized and self-hosted by Next.js at build time (no runtime API calls)

---

*Integration audit: 2026-03-06*
