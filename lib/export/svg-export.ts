import { prepareSvgForExport, triggerDownload } from "./export-utils";

/**
 * Exports an SVG element as a downloadable .svg file.
 */
export async function exportSVG(
  svgElement: SVGSVGElement,
  filename = "great-lakes-cruise.svg"
): Promise<void> {
  const clone = prepareSvgForExport(svgElement);
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  triggerDownload(blob, filename);
}
