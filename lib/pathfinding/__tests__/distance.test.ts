import { describe, it, expect } from "vitest";
import { computeDistanceNm, formatTime } from "../distance";

describe("computeDistanceNm", () => {
  it("returns ~51.5 nm for 1 degree longitude at lat 45", () => {
    const d = computeDistanceNm([
      { lng: -87, lat: 45 },
      { lng: -86, lat: 45 },
    ]);
    // 1 degree longitude at lat 45 ~ 42.5 nm (cos(45) * 60)
    expect(d).toBeGreaterThan(41);
    expect(d).toBeLessThan(44);
  });

  it("returns 0 for empty array", () => {
    expect(computeDistanceNm([])).toBe(0);
  });

  it("returns 0 for single point", () => {
    expect(computeDistanceNm([{ lng: -87, lat: 45 }])).toBe(0);
  });
});

describe("formatTime", () => {
  it("returns hours and minutes for 100nm at 10kn", () => {
    expect(formatTime(100, 10)).toBe("10h 0m");
  });

  it("returns just minutes when less than 1 hour", () => {
    expect(formatTime(5, 10)).toBe("30m");
  });

  it("returns 0m for zero distance", () => {
    expect(formatTime(0, 10)).toBe("0m");
  });
});
