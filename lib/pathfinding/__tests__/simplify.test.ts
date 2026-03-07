import { describe, it, expect } from "vitest";
import { simplifyPath } from "@/lib/pathfinding/simplify";

describe("simplifyPath", () => {
  it("with epsilon=0 keeps all non-collinear points", () => {
    // Points with actual turns -- none are exactly on the line between endpoints
    const points: [number, number][] = [
      [0, 0],
      [1, 2],
      [3, 1],
      [5, 5],
    ];
    const result = simplifyPath(points, 0);
    expect(result).toEqual(points);
  });

  it("removes collinear points (3 points in a line -> 2 points)", () => {
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
    ];
    const result = simplifyPath(points, 0.1);
    expect(result).toEqual([
      [0, 0],
      [2, 0],
    ]);
  });

  it("preserves endpoints and significant turns", () => {
    // L-shaped path: right then up
    const points: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ];
    const result = simplifyPath(points, 0.1);
    // Should keep: start, corner at (2,0), and end
    expect(result[0]).toEqual([0, 0]);
    expect(result[result.length - 1]).toEqual([2, 2]);
    expect(result.length).toBeLessThan(points.length);
    // The corner point (2,0) must be preserved
    expect(result).toContainEqual([2, 0]);
  });

  it("handles single point", () => {
    const result = simplifyPath([[5, 5]], 1);
    expect(result).toEqual([[5, 5]]);
  });

  it("handles two points", () => {
    const result = simplifyPath(
      [
        [0, 0],
        [5, 5],
      ],
      1
    );
    expect(result).toEqual([
      [0, 0],
      [5, 5],
    ]);
  });

  it("preserves points with large perpendicular distance", () => {
    // Triangle: far point off the line
    const points: [number, number][] = [
      [0, 0],
      [5, 10],
      [10, 0],
    ];
    const result = simplifyPath(points, 1);
    // Middle point is far from line, should be kept
    expect(result.length).toBe(3);
  });
});
