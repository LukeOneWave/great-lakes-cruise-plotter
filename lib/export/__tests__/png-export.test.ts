import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportPNG } from "../png-export";
import * as utils from "../export-utils";

vi.mock("../export-utils", () => ({
  renderToCanvas: vi.fn(),
  triggerDownload: vi.fn(),
}));

describe("exportPNG", () => {
  let mockSvg: SVGSVGElement;
  let mockCanvas: HTMLCanvasElement;
  const mockBlob = new Blob(["fake"], { type: "image/png" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    mockCanvas = document.createElement("canvas");
    // Mock toBlob to call callback with a blob
    mockCanvas.toBlob = vi.fn((cb: BlobCallback) => cb(mockBlob));
    vi.mocked(utils.renderToCanvas).mockResolvedValue(mockCanvas);
  });

  it("calls renderToCanvas with scale 2", async () => {
    await exportPNG(mockSvg);
    expect(utils.renderToCanvas).toHaveBeenCalledWith(mockSvg, 2);
  });

  it("calls canvas.toBlob with image/png", async () => {
    await exportPNG(mockSvg);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
  });

  it("calls triggerDownload with PNG blob and default filename", async () => {
    await exportPNG(mockSvg);
    expect(utils.triggerDownload).toHaveBeenCalledWith(mockBlob, "great-lakes-cruise.png");
  });

  it("uses custom filename when provided", async () => {
    await exportPNG(mockSvg, "custom.png");
    expect(utils.triggerDownload).toHaveBeenCalledWith(mockBlob, "custom.png");
  });
});
