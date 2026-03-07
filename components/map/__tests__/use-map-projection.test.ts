import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { FeatureCollection } from "geojson";
import { useMapProjection } from "../use-map-projection";

// Simple polygon covering Great Lakes bounding box
const mockFeatureCollection: FeatureCollection = {
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

describe("useMapProjection", () => {
  it("returns null projection when width is 0", () => {
    const { result } = renderHook(() =>
      useMapProjection(0, 600, mockFeatureCollection)
    );
    expect(result.current.projection).toBeNull();
    expect(result.current.path).toBeNull();
  });

  it("returns null projection when height is 0", () => {
    const { result } = renderHook(() =>
      useMapProjection(960, 0, mockFeatureCollection)
    );
    expect(result.current.projection).toBeNull();
    expect(result.current.path).toBeNull();
  });

  it("returns valid projection and path for non-zero dimensions", () => {
    const { result } = renderHook(() =>
      useMapProjection(960, 600, mockFeatureCollection)
    );
    expect(result.current.projection).not.toBeNull();
    expect(result.current.path).not.toBeNull();
    expect(typeof result.current.projection).toBe("function");
    expect(typeof result.current.path).toBe("function");
  });

  it("projects Great Lakes coordinates to within SVG bounds", () => {
    const { result } = renderHook(() =>
      useMapProjection(960, 600, mockFeatureCollection)
    );
    const { projection } = result.current;
    expect(projection).not.toBeNull();

    // Center of Great Lakes region: roughly Lake Huron
    const point = projection!([-84, 45]);
    expect(point).not.toBeNull();

    const [x, y] = point!;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(960);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(600);
  });
});
