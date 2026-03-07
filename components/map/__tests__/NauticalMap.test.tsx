import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { FeatureCollection } from "geojson";

// Mock loadCoastlines before importing NauticalMap
const mockFeatureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Lake Superior" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-92, 46],
            [-84, 46],
            [-84, 49],
            [-92, 49],
            [-92, 46],
          ],
        ],
      },
    },
  ],
};

vi.mock("@/lib/geo/load-geo", () => ({
  loadCoastlines: () => mockFeatureCollection,
}));

// Dynamic import after mock is set up
const { NauticalMap } = await import("../NauticalMap");

describe("NauticalMap", () => {
  it("renders an SVG element", () => {
    const { container } = render(<NauticalMap width={960} height={600} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("SVG contains a background rect with water gradient fill", () => {
    const { container } = render(<NauticalMap width={960} height={600} />);
    const rect = container.querySelector("svg > rect");
    expect(rect).not.toBeNull();
    expect(rect?.getAttribute("fill")).toContain("url(#water-depth)");
  });

  it("SVG contains coastline path elements", () => {
    const { container } = render(<NauticalMap width={960} height={600} />);
    const coastlineLayer = container.querySelector("g.coastline-layer");
    expect(coastlineLayer).not.toBeNull();
    const paths = coastlineLayer?.querySelectorAll("path");
    expect(paths!.length).toBeGreaterThan(0);
  });

  it("SVG contains graticule layer", () => {
    const { container } = render(<NauticalMap width={960} height={600} />);
    const graticuleLayer = container.querySelector("g.graticule-layer");
    expect(graticuleLayer).not.toBeNull();
  });

  it("SVG contains compass rose group", () => {
    const { container } = render(<NauticalMap width={960} height={600} />);
    const compassRose = container.querySelector("g.compass-rose");
    expect(compassRose).not.toBeNull();
  });
});
