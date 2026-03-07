import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { TripSummary } from "../TripSummary";
import type { RouteLeg } from "@/lib/pathfinding/types";
import type { Port } from "@/lib/ports/types";

const duluth: Port = { id: "duluth", name: "Duluth", lake: "Lake Superior", lat: 46.78, lng: -92.1, country: "US" };
const chicago: Port = { id: "chicago", name: "Chicago", lake: "Lake Michigan", lat: 41.88, lng: -87.62, country: "US" };
const detroit: Port = { id: "detroit", name: "Detroit", lake: "Lake Erie", lat: 42.33, lng: -83.05, country: "US" };

vi.mock("@/lib/pathfinding/distance", () => ({
  formatTime: (distanceNm: number, speedKnots: number) => {
    const totalMin = Math.round((distanceNm / speedKnots) * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  },
}));

const mockLegs: RouteLeg[] = [
  {
    from: duluth,
    to: chicago,
    path: { points: [], gridCellCount: 10 },
    distanceNm: 100,
  },
  {
    from: chicago,
    to: detroit,
    path: { points: [], gridCellCount: 8 },
    distanceNm: 150,
  },
];

describe("TripSummary", () => {
  it("renders empty state when no legs", () => {
    render(<TripSummary routeLegs={[]} speedKnots={10} />);
    expect(screen.getByText("No route yet")).toBeInTheDocument();
  });

  it("renders total distance and time", () => {
    render(<TripSummary routeLegs={mockLegs} speedKnots={10} />);
    expect(screen.getByText(/250\.0\s*nm/)).toBeInTheDocument();
    expect(screen.getByText("25h 0m")).toBeInTheDocument();
  });

  it("renders per-leg rows with from/to names", () => {
    render(<TripSummary routeLegs={mockLegs} speedKnots={10} />);
    expect(screen.getByText("Duluth")).toBeInTheDocument();
    expect(screen.getAllByText("Chicago")).toHaveLength(2); // To in leg 1, From in leg 2
    expect(screen.getByText("Detroit")).toBeInTheDocument();
    expect(screen.getByText(/^100\.0/)).toBeInTheDocument();
    expect(screen.getByText(/^150\.0/)).toBeInTheDocument();
  });

  it("handles leg with null path", () => {
    const legsWithNull: RouteLeg[] = [
      { from: duluth, to: chicago, path: null, distanceNm: 0 },
    ];
    render(<TripSummary routeLegs={legsWithNull} speedKnots={10} />);
    expect(screen.getByText("No route found")).toBeInTheDocument();
  });
});
