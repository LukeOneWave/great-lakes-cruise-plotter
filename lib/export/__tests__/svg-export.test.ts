import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportSVG } from "../svg-export";
import * as utils from "../export-utils";

vi.mock("../export-utils", () => ({
  prepareSvgForExport: vi.fn(),
  triggerDownload: vi.fn(),
}));

describe("exportSVG", () => {
  let mockSvg: SVGSVGElement;
  let mockClone: SVGSVGElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    mockClone = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    vi.mocked(utils.prepareSvgForExport).mockReturnValue(mockClone);
  });

  it("calls prepareSvgForExport with the svg element", async () => {
    await exportSVG(mockSvg);
    expect(utils.prepareSvgForExport).toHaveBeenCalledWith(mockSvg);
  });

  it("calls triggerDownload with SVG blob and default filename", async () => {
    await exportSVG(mockSvg);
    expect(utils.triggerDownload).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(utils.triggerDownload).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/svg+xml");
    expect(filename).toBe("great-lakes-cruise.svg");
  });

  it("uses custom filename when provided", async () => {
    await exportSVG(mockSvg, "custom.svg");
    const [, filename] = vi.mocked(utils.triggerDownload).mock.calls[0];
    expect(filename).toBe("custom.svg");
  });
});
