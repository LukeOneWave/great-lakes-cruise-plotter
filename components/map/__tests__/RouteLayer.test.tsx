import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { GeoProjection } from "d3-geo";

// Mock projection: scale coordinates by 10
const mockProjection: GeoProjection = ((coords: [number, number]) =>
  coords ? [coords[0] * 10, coords[1] * 10] : null
) as unknown as GeoProjection;

import { RouteLayer } from "../RouteLayer";

function renderRouteLayer(
  routePoints: Array<{ lng: number; lat: number }> = [],
  projection: GeoProjection = mockProjection
) {
  return render(
    <svg>
      <RouteLayer routePoints={routePoints} projection={projection} />
    </svg>
  );
}

describe("RouteLayer", () => {
  it("renders null when routePoints is empty array", () => {
    const { container } = renderRouteLayer([]);
    const group = container.querySelector("g.route-layer");
    expect(group).toBeNull();
  });

  it("renders null when routePoints has only one point", () => {
    const { container } = renderRouteLayer([{ lng: -85, lat: 45 }]);
    const group = container.querySelector("g.route-layer");
    expect(group).toBeNull();
  });

  it("renders SVG path with stroke-dasharray when given valid points", () => {
    const points = [
      { lng: -85, lat: 45 },
      { lng: -84, lat: 44 },
      { lng: -83, lat: 43 },
    ];
    const { container } = renderRouteLayer(points);
    const path = container.querySelector("g.route-layer path[stroke-dasharray]");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("stroke-dasharray")).toBe("8,4");
  });

  it("renders marker def with id='route-arrow'", () => {
    const points = [
      { lng: -85, lat: 45 },
      { lng: -84, lat: 44 },
    ];
    const { container } = renderRouteLayer(points);
    const marker = container.querySelector("marker#route-arrow");
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute("orient")).toBe("auto");
  });

  it("path d attribute starts with M (moveto)", () => {
    const points = [
      { lng: -85, lat: 45 },
      { lng: -84, lat: 44 },
      { lng: -83, lat: 43 },
    ];
    const { container } = renderRouteLayer(points);
    const path = container.querySelector("g.route-layer path[stroke-dasharray]");
    const d = path?.getAttribute("d") ?? "";
    expect(d).toMatch(/^M\s/);
  });

  it("route uses navy blue color distinct from ports and coastlines", () => {
    const points = [
      { lng: -85, lat: 45 },
      { lng: -84, lat: 44 },
    ];
    const { container } = renderRouteLayer(points);
    const path = container.querySelector("g.route-layer path[stroke-dasharray]");
    expect(path?.getAttribute("stroke")).toBe("#1a3a5c");
  });
});
