import { jsPDF } from "jspdf";
import { renderToCanvas } from "./export-utils";

/**
 * Exports an SVG element as a landscape A4 PDF with optional trip summary text.
 */
export async function exportPDF(
  svgElement: SVGSVGElement,
  filename = "great-lakes-cruise.pdf",
  tripSummary?: string
): Promise<void> {
  const canvas = await renderToCanvas(svgElement, 2);
  const dataUrl = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const availableWidth = pageWidth - margin * 2;
  const bottomReserve = tripSummary ? 15 : 0;
  const availableHeight = pageHeight - margin * 2 - bottomReserve;

  pdf.addImage(dataUrl, "PNG", margin, margin, availableWidth, availableHeight);

  if (tripSummary) {
    pdf.setFontSize(10);
    pdf.text(tripSummary, margin, pageHeight - margin);
  }

  pdf.save(filename);
}
