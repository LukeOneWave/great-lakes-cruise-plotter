# Phase 5: Export Pipeline - Research

**Researched:** 2026-03-07
**Domain:** Client-side file export (SVG/PNG/PDF) from inline SVG
**Confidence:** HIGH

## Summary

Phase 5 exports the nautical map SVG to three formats: SVG (serialize DOM), PNG (SVG-to-Canvas), and PDF (via jsPDF already installed). The inline SVG architecture chosen in Phase 2 makes this straightforward -- the SVG element can be serialized directly from the DOM. PNG requires rendering to a Canvas via an Image element. PDF uses jsPDF (v4.2.0 already in dependencies) to embed the PNG into a landscape page.

No new dependencies are needed. jsPDF is already installed. The SVG-to-Canvas-to-PNG pipeline is browser-native (XMLSerializer + Canvas + Image). The main complexity is ensuring all SVG defs (gradients, filters from MapDefs.tsx) are inlined in the serialized SVG string so they render correctly in standalone files.

**Primary recommendation:** Use browser-native APIs (XMLSerializer, Canvas, Blob/URL) for SVG and PNG export; use the already-installed jsPDF for PDF. No additional libraries needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SVG Export: Serialize inline SVG to downloadable .svg file with all styling inlined
- PNG Export: Render SVG to Canvas, export as PNG at 2x resolution minimum
- PDF Export: Pipeline SVG -> Canvas -> PNG -> PDF using jsPDF (already installed)
- Export UI: Button/dropdown in top bar or route planning panel with loading indicator

### Claude's Discretion
- Exact export button placement and styling
- Dropdown vs three separate buttons
- PDF page margins and text layout
- Font embedding in SVG vs web-safe fallbacks
- Canvas rendering approach (html2canvas vs manual SVG-to-Canvas)

### Deferred Ideas (OUT OF SCOPE)
- Print-optimized layout with legend (VIS-03, v2)
- Multiple export resolutions/sizes
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXP-01 | User can export map as SVG | XMLSerializer to serialize SVG DOM node, Blob download |
| EXP-02 | User can export map as high-res PNG | SVG string -> Image -> Canvas at 2x -> toBlob('image/png') |
| EXP-03 | User can export map as print-ready PDF | PNG from EXP-02 pipeline -> jsPDF addImage on landscape page |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | 4.2.0 | PDF generation | Already installed, well-maintained, no server needed |
| XMLSerializer | Browser API | SVG serialization | Native, zero-dependency, handles all SVG features |
| Canvas API | Browser API | SVG-to-PNG rasterization | Native, supports 2x scaling via width/height attributes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Blob/URL.createObjectURL | Browser API | File download triggering | Creating downloadable file links |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual SVG-to-Canvas | html2canvas | html2canvas captures HTML not SVG; manual approach gives full control over SVG rendering and is simpler for this use case |
| svg2pdf.js | PNG-in-PDF via jsPDF | svg2pdf.js would give vector PDF but has SVG feature support concerns (gradients, filters); PNG-in-PDF is reliable and matches CONTEXT.md decision |

**Installation:**
```bash
# No new packages needed -- jsPDF already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── export/
│       ├── svg-export.ts      # SVG serialization + download
│       ├── png-export.ts      # SVG-to-Canvas-to-PNG pipeline
│       ├── pdf-export.ts      # PNG-to-PDF via jsPDF
│       └── export-utils.ts    # Shared: SVG prep, download trigger, inline styles
├── components/
│   └── ui/
│       └── ExportMenu.tsx     # Export dropdown/buttons UI
```

### Pattern 1: SVG Serialization with Inlined Defs
**What:** Clone the SVG DOM node, ensure all `<defs>` (gradients, filters, patterns) are included, serialize with XMLSerializer, create Blob download.
**When to use:** EXP-01
**Example:**
```typescript
function exportSVG(svgElement: SVGSVGElement, filename: string): void {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  // Set explicit dimensions for standalone viewing
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename);
}
```

### Pattern 2: SVG-to-Canvas-to-PNG at 2x
**What:** Convert serialized SVG to a data URL, load into Image, draw onto Canvas at 2x dimensions, export as PNG Blob.
**When to use:** EXP-02
**Example:**
```typescript
async function exportPNG(svgElement: SVGSVGElement, filename: string): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, filename);
  }, 'image/png');
}
```

### Pattern 3: PNG-to-PDF via jsPDF
**What:** Generate PNG data from Canvas, create jsPDF landscape document, add image filling the page.
**When to use:** EXP-03
**Example:**
```typescript
import { jsPDF } from 'jspdf';

async function exportPDF(svgElement: SVGSVGElement, filename: string, tripSummary?: string): Promise<void> {
  // Reuse PNG pipeline to get canvas
  const canvas = await renderToCanvas(svgElement, 2);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit map to page with margins
  const margin = 10;
  const mapWidth = pageWidth - 2 * margin;
  const mapHeight = pageHeight - 2 * margin - (tripSummary ? 20 : 0);

  pdf.addImage(imgData, 'PNG', margin, margin, mapWidth, mapHeight);

  if (tripSummary) {
    pdf.setFontSize(10);
    pdf.text(tripSummary, margin, pageHeight - margin);
  }

  pdf.save(filename);
}
```

### Pattern 4: Download Trigger Utility
```typescript
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### Anti-Patterns to Avoid
- **Using html2canvas for SVG export:** It captures HTML layout, not SVG internals. Manual SVG serialization is more reliable and simpler.
- **Forgetting xmlns on serialized SVG:** Without the namespace attribute, standalone SVG files won't render in browsers/editors.
- **Not cloning before serializing:** Modifying the live DOM SVG for export (adding attributes) would cause visual glitches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom PDF byte stream | jsPDF (already installed) | PDF spec is enormous, jsPDF handles it |
| File download | window.open or manual fetch | Blob + createObjectURL + anchor click | Works cross-browser, handles large files |

## Common Pitfalls

### Pitfall 1: SVG External References Break in Export
**What goes wrong:** SVG uses CSS classes, external fonts, or stylesheet references that don't exist in the exported file.
**Why it happens:** Inline SVG in a webpage inherits page styles; standalone SVG does not.
**How to avoid:** This project uses inline styles and NAUTICAL_COLORS constants (not CSS classes for SVG elements), so this is already handled. Verify MapDefs gradients/filters are inside the SVG element being serialized.
**Warning signs:** Exported SVG looks unstyled or has missing colors.

### Pitfall 2: Canvas Tainted by Cross-Origin Images
**What goes wrong:** canvas.toBlob() throws SecurityError if any cross-origin images were drawn.
**Why it happens:** Browser CORS policy taints canvas when external images are loaded.
**How to avoid:** This project renders everything as inline SVG paths (no external images), so this should not be an issue. If any external resources are added later, they must be loaded with CORS headers.
**Warning signs:** SecurityError on toBlob() or toDataURL().

### Pitfall 3: SVG-to-Image Rendering Fails Silently
**What goes wrong:** The Image element's onload fires but the canvas is blank or partially rendered.
**Why it happens:** Some SVG features (foreignObject, complex filters) may not render when loaded as an image source.
**How to avoid:** Stick to basic SVG elements (path, circle, text, linearGradient, radialGradient). The nautical map uses standard SVG features that render reliably.
**Warning signs:** Blank or incomplete PNG/PDF output.

### Pitfall 4: Large Canvas Memory on Mobile
**What goes wrong:** 2x resolution canvas (e.g., 3840x2400) uses significant memory.
**Why it happens:** Canvas pixel buffer = width * height * 4 bytes = ~37MB at 2x.
**How to avoid:** This is acceptable for desktop-focused export. If needed later, detect mobile and use 1x. For v1, 2x is fine.

## Code Examples

See Architecture Patterns section above -- all examples are verified browser API patterns.

### SVG Ref Access Pattern
The export functions need a ref to the SVG element. Pass via React ref:
```typescript
// In page.tsx or parent component
const svgRef = useRef<SVGSVGElement>(null);

// Pass to NauticalMap
<NauticalMap ref={svgRef} ... />

// Pass to ExportMenu
<ExportMenu svgRef={svgRef} tripSummary={tripSummary} />
```

NauticalMap will need `forwardRef` to expose the SVG element.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side rendering (puppeteer/phantomjs) | Client-side Canvas + jsPDF | 2020+ | No server needed, instant export |
| svg2pdf.js for vector PDF | PNG-in-PDF via jsPDF | Project decision | Avoids SVG feature compatibility issues |

## Open Questions

1. **Font rendering in exported SVG/PNG**
   - What we know: The map uses system fonts via CSS. Exported SVG won't have font guarantees.
   - What's unclear: Whether text labels render correctly in all viewers.
   - Recommendation: Use web-safe fonts (serif/sans-serif) as fallback in SVG export. This is in Claude's discretion per CONTEXT.md.

2. **NauticalMap forwardRef**
   - What we know: Export needs a ref to the SVG DOM element.
   - What's unclear: Whether NauticalMap already uses forwardRef.
   - Recommendation: Add forwardRef wrapper if not present. Minimal change.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts (assumed from package.json scripts) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXP-01 | SVG serialization produces valid SVG string | unit | `npx vitest run src/lib/export/svg-export.test.ts -x` | Wave 0 |
| EXP-02 | PNG export calls Canvas APIs correctly | unit | `npx vitest run src/lib/export/png-export.test.ts -x` | Wave 0 |
| EXP-03 | PDF export creates jsPDF document with image | unit | `npx vitest run src/lib/export/pdf-export.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `src/lib/export/svg-export.test.ts` -- covers EXP-01
- [ ] `src/lib/export/png-export.test.ts` -- covers EXP-02
- [ ] `src/lib/export/pdf-export.test.ts` -- covers EXP-03
- Note: Canvas/Image/Blob APIs need mocking in Vitest (jsdom doesn't have Canvas). Consider testing the serialization logic and mocking browser APIs.

## Sources

### Primary (HIGH confidence)
- Browser APIs: XMLSerializer, Canvas, Blob, URL.createObjectURL -- stable web standards
- jsPDF v4.2.0 -- already in project dependencies, well-documented API

### Secondary (MEDIUM confidence)
- SVG-to-Canvas rendering behavior -- based on established browser patterns, may vary by browser

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using browser-native APIs + already-installed jsPDF
- Architecture: HIGH - straightforward serialization/rasterization pipeline
- Pitfalls: HIGH - well-known gotchas with SVG export, project architecture avoids most

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable browser APIs, unlikely to change)
