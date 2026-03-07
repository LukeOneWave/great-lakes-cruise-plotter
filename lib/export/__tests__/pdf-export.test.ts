import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSave, mockAddImage, mockSetFontSize, mockText, MockJsPDF } = vi.hoisted(() => {
  const mockSave = vi.fn();
  const mockAddImage = vi.fn();
  const mockSetFontSize = vi.fn();
  const mockText = vi.fn();
  class MockJsPDF {
    addImage = mockAddImage;
    setFontSize = mockSetFontSize;
    text = mockText;
    save = mockSave;
    internal = {
      pageSize: { getWidth: () => 297, getHeight: () => 210 },
    };
  }
  return { mockSave, mockAddImage, mockSetFontSize, mockText, MockJsPDF };
});

vi.mock("jspdf", () => ({
  jsPDF: MockJsPDF,
}));

vi.mock("../export-utils", () => ({
  renderToCanvas: vi.fn(),
}));

import { exportPDF } from "../pdf-export";
import * as utils from "../export-utils";

describe("exportPDF", () => {
  let mockSvg: SVGSVGElement;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    mockCanvas = document.createElement("canvas");
    mockCanvas.toDataURL = vi.fn(() => "data:image/png;base64,fake");
    vi.mocked(utils.renderToCanvas).mockResolvedValue(mockCanvas);
  });

  it("calls renderToCanvas with scale 2", async () => {
    await exportPDF(mockSvg);
    expect(utils.renderToCanvas).toHaveBeenCalledWith(mockSvg, 2);
  });

  it("creates jsPDF and calls addImage and save", async () => {
    await exportPDF(mockSvg);
    // Verify core PDF pipeline: addImage was called and save was called
    expect(mockAddImage).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it("calls addImage with PNG data", async () => {
    await exportPDF(mockSvg);
    expect(mockAddImage).toHaveBeenCalledWith(
      "data:image/png;base64,fake",
      "PNG",
      10, 10,
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("calls save with default filename", async () => {
    await exportPDF(mockSvg);
    expect(mockSave).toHaveBeenCalledWith("great-lakes-cruise.pdf");
  });

  it("adds trip summary text when provided", async () => {
    await exportPDF(mockSvg, "map.pdf", "My Great Lakes Trip");
    expect(mockSetFontSize).toHaveBeenCalledWith(10);
    expect(mockText).toHaveBeenCalledWith("My Great Lakes Trip", 10, expect.any(Number));
  });

  it("does not add text when no trip summary", async () => {
    await exportPDF(mockSvg);
    expect(mockText).not.toHaveBeenCalled();
  });
});
