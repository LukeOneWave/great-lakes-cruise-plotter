import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { geoConicEqualArea, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { MAP_CONFIG } from "../constants";

// We need to dynamically import after we have the module
const { GraticuleLayer } = await import("../GraticuleLayer");

// Create a real projection for testing
const mockData: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-92, 41],
            [-76, 41],
            [-76, 49],
            [-92, 49],
            [-92, 41],
          ],
        ],
      },
    },
  ],
};

const projection = geoConicEqualArea()
  .parallels(MAP_CONFIG.projectionParallels)
  .rotate(MAP_CONFIG.projectionRotate)
  .fitExtent(
    [
      [20, 20],
      [940, 580],
    ],
    mockData
  );

const pathGenerator = geoPath(projection);

describe("GraticuleLayer", () => {
  it("renders graticule path element", () => {
    const { container } = render(
      <svg>
        <GraticuleLayer projection={projection} path={pathGenerator} />
      </svg>
    );
    const graticuleLayer = container.querySelector("g.graticule-layer");
    expect(graticuleLayer).not.toBeNull();
    const paths = graticuleLayer?.querySelectorAll("path");
    expect(paths!.length).toBeGreaterThan(0);
  });

  it("renders degree label text elements", () => {
    const { container } = render(
      <svg>
        <GraticuleLayer projection={projection} path={pathGenerator} />
      </svg>
    );
    const graticuleLayer = container.querySelector("g.graticule-layer");
    const texts = graticuleLayer?.querySelectorAll("text");
    expect(texts!.length).toBeGreaterThan(0);

    // Check for degree labels like "84°W" or "45°N"
    const textContents = Array.from(texts!).map((t) => t.textContent);
    const hasLongitudeLabel = textContents.some((t) => t?.match(/\d+.*W/));
    const hasLatitudeLabel = textContents.some((t) => t?.match(/\d+.*N/));
    expect(hasLongitudeLabel).toBe(true);
    expect(hasLatitudeLabel).toBe(true);
  });
});
