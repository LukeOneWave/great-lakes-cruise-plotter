/**
 * Shared export utilities for SVG, PNG, and PDF export pipelines.
 */

/**
 * Triggers a browser file download from a Blob.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Deep-clones an SVG element and sets required XML namespaces for standalone export.
 * Does NOT modify the live DOM.
 */
export function prepareSvgForExport(svgElement: SVGSVGElement): SVGSVGElement {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  return clone;
}

/**
 * Renders an SVG element onto a canvas at the given scale factor.
 * Shared pipeline used by both PNG and PDF export.
 */
export function renderToCanvas(
  svgElement: SVGSVGElement,
  scale: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const clone = prepareSvgForExport(svgElement);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const width = svgElement.width.baseVal.value || svgElement.clientWidth || 800;
      const height = svgElement.height.baseVal.value || svgElement.clientHeight || 600;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get canvas 2d context"));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image for canvas rendering"));
    };
    img.src = url;
  });
}
