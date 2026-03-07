import { renderToCanvas, triggerDownload } from "./export-utils";

/**
 * Exports an SVG element as a high-resolution PNG file (2x scale).
 */
export async function exportPNG(
  svgElement: SVGSVGElement,
  filename = "great-lakes-cruise.png"
): Promise<void> {
  const canvas = await renderToCanvas(svgElement, 2);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
  triggerDownload(blob, filename);
}
