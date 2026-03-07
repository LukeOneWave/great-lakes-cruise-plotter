import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Port } from "@/lib/ports/types";
import type { GreatLakeName } from "@/lib/geo/types";
import type { GeoProjection } from "d3-geo";

// Create mock ports (use 3 for basic tests)
function makeMockPort(id: string, name: string): Port {
  return {
    id,
    name,
    lat: 45,
    lng: -85,
    lake: "Lake Michigan" as GreatLakeName,
    type: "city",
    country: "US",
  };
}

const mockPorts: Port[] = [
  makeMockPort("p1", "Chicago"),
  makeMockPort("p2", "Milwaukee"),
  makeMockPort("p3", "Traverse City"),
];

// Mock projection that returns [100, 100] for any input
const mockProjection: GeoProjection = ((coords: [number, number]) => [
  100 + Number(coords[0]),
  100 + Number(coords[1]),
]) as unknown as GeoProjection;

// Import the component
import { PortLayer } from "../PortLayer";

function renderPortLayer(overrides: Record<string, unknown> = {}) {
  const defaultProps = {
    ports: mockPorts,
    projection: mockProjection,
    selectedIds: new Set<string>(),
    hoveredId: null as string | null,
    onSelect: vi.fn(),
    onHover: vi.fn(),
  };
  return render(
    <svg>
      <PortLayer {...defaultProps} {...overrides} />
    </svg>
  );
}

describe("PortLayer", () => {
  it("renders a circle element for each port", () => {
    const { container } = renderPortLayer();
    const circles = container.querySelectorAll("g.port-layer circle");
    expect(circles.length).toBe(3);
  });

  it("default ports have small radius (r=3) and portDefault fill", () => {
    const { container } = renderPortLayer();
    const circle = container.querySelector("g.port-layer circle");
    expect(circle?.getAttribute("r")).toBe("3");
    expect(circle?.getAttribute("fill")).toBe("#5c4a32");
  });

  it("selected port has larger radius (r=6) and portSelected fill with white stroke", () => {
    const { container } = renderPortLayer({
      selectedIds: new Set(["p2"]),
    });
    const circles = container.querySelectorAll("g.port-layer g.port-marker");
    // Find the selected port marker (p2 is index 1)
    const selectedGroup = circles[1];
    const circle = selectedGroup?.querySelector("circle");
    expect(circle?.getAttribute("r")).toBe("6");
    expect(circle?.getAttribute("fill")).toBe("#c0392b");
    expect(circle?.getAttribute("stroke")).toBe("white");
  });

  it("hovering a port shows a text label with the port name", () => {
    const { container } = renderPortLayer({ hoveredId: "p1" });
    const labels = container.querySelectorAll("g.port-layer text");
    const labelTexts = Array.from(labels).map((l) => l.textContent);
    expect(labelTexts).toContain("Chicago");
  });

  it("clicking a port calls onSelect callback with port id", () => {
    const onSelect = vi.fn();
    const { container } = renderPortLayer({ onSelect });
    const circles = container.querySelectorAll("g.port-layer circle");
    fireEvent.click(circles[0]);
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("selected port shows persistent label", () => {
    const { container } = renderPortLayer({
      selectedIds: new Set(["p2"]),
    });
    const labels = container.querySelectorAll("g.port-layer text");
    const labelTexts = Array.from(labels).map((l) => l.textContent);
    expect(labelTexts).toContain("Milwaukee");
  });

  it("non-hovered, non-selected port does not show label", () => {
    const { container } = renderPortLayer();
    const labels = container.querySelectorAll("g.port-layer text");
    expect(labels.length).toBe(0);
  });

  it("mouse enter calls onHover with port id, mouse leave calls with null", () => {
    const onHover = vi.fn();
    const { container } = renderPortLayer({ onHover });
    const circles = container.querySelectorAll("g.port-layer circle");
    fireEvent.mouseEnter(circles[0]);
    expect(onHover).toHaveBeenCalledWith("p1");
    fireEvent.mouseLeave(circles[0]);
    expect(onHover).toHaveBeenCalledWith(null);
  });
});
