# Phase 5: Export Pipeline - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning
**Source:** Auto-generated from project context (--auto mode)

<domain>
## Phase Boundary

Export the current map view (with routes, ports, and nautical styling) as SVG, high-res PNG, and print-ready PDF. Users download their completed cruise maps in multiple formats.

Requirements: EXP-01 (SVG export), EXP-02 (PNG export), EXP-03 (PDF export)

</domain>

<decisions>
## Implementation Decisions

### SVG Export (EXP-01)
- Serialize the existing inline SVG to a downloadable .svg file
- Include all styling (nautical colors, fonts, gradients) inline in the SVG
- Preserve route lines, port markers, labels, compass rose

### PNG Export (EXP-02)
- Render SVG to Canvas, then export Canvas as PNG
- High resolution: at least 2x for crisp output (e.g., 1920x1200 base -> 3840x2400 PNG)
- Use OffscreenCanvas or standard Canvas element

### PDF Export (EXP-03)
- Pipeline: SVG -> Canvas -> PNG -> PDF (per STATE.md research note)
- jsPDF already installed as dependency
- Single-page landscape PDF with the map filling the page
- Include trip summary text below/beside the map if a route exists

### Export UI
- Export button/dropdown in the top bar or route planning panel
- Options: SVG, PNG, PDF
- Loading indicator during export (PNG/PDF may take a moment)

### Claude's Discretion
- Exact export button placement and styling
- Whether to use a dropdown or three separate buttons
- PDF page margins and text layout
- Whether to embed fonts in SVG or use web-safe fallbacks
- Canvas rendering approach (html2canvas vs manual SVG-to-Canvas)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/map/NauticalMap.tsx`: The SVG element to be exported
- `components/map/MapDefs.tsx`: SVG gradients and filters (must be included in export)
- `components/map/constants.ts`: NAUTICAL_COLORS for consistent styling
- `jspdf` v4.2.0: Already installed for PDF generation
- Route and trip data available in page.tsx state

### Established Patterns
- Inline SVG rendering (good for serialization)
- "use client" components
- Tailwind CSS for UI controls

### Integration Points
- Export functions need access to the SVG DOM element (ref)
- Trip summary data for PDF annotation
- New export UI components in the page layout

</code_context>

<specifics>
## Specific Ideas

- STATE.md notes: "svg2pdf.js SVG feature support should be verified against nautical styling elements"
- The inline SVG approach (chosen in Phase 2) makes SVG export straightforward — serialize the DOM node
- PNG export quality matters — this is the format users will share on social media
- PDF should look like a print-worthy nautical chart document

</specifics>

<deferred>
## Deferred Ideas

- Print-optimized layout with legend — v2 (VIS-03)
- Multiple export resolutions/sizes — future enhancement

</deferred>

---

*Phase: 05-export-pipeline*
*Context gathered: 2026-03-07 via auto-mode*
