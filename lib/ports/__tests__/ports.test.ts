import { describe, it, expect } from "vitest";
import portsData from "@/lib/ports/ports.json";
import type { Port } from "@/lib/ports/types";

const ports = portsData as Port[];

describe("Port database integrity", () => {
  it("has between 80 and 100 entries", () => {
    expect(ports.length).toBeGreaterThanOrEqual(80);
    expect(ports.length).toBeLessThanOrEqual(100);
  });

  it("every port has all required fields", () => {
    for (const port of ports) {
      expect(port.id).toBeDefined();
      expect(typeof port.id).toBe("string");
      expect(port.id.length).toBeGreaterThan(0);

      expect(port.name).toBeDefined();
      expect(typeof port.name).toBe("string");
      expect(port.name.length).toBeGreaterThan(0);

      expect(typeof port.lat).toBe("number");
      expect(typeof port.lng).toBe("number");

      expect(port.lake).toBeDefined();
      expect(typeof port.lake).toBe("string");

      expect(port.type).toBeDefined();
      expect(["city", "marina", "island", "landmark"]).toContain(port.type);

      expect(port.country).toBeDefined();
      expect(["US", "CA"]).toContain(port.country);
    }
  });

  it("has no duplicate port IDs", () => {
    const ids = ports.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all lat values between 41.0 and 49.5", () => {
    for (const port of ports) {
      expect(port.lat).toBeGreaterThanOrEqual(41.0);
      expect(port.lat).toBeLessThanOrEqual(49.5);
    }
  });

  it("all lng values between -92.5 and -75.5", () => {
    for (const port of ports) {
      expect(port.lng).toBeGreaterThanOrEqual(-92.5);
      expect(port.lng).toBeLessThanOrEqual(-75.5);
    }
  });

  it("all lakes are valid GreatLakeName values", () => {
    const validLakes = [
      "Superior",
      "Michigan",
      "Huron",
      "Erie",
      "Ontario",
      "St. Clair",
    ];
    for (const port of ports) {
      expect(validLakes).toContain(port.lake);
    }
  });

  const lakeMinimums: Record<string, number> = {
    Superior: 5,
    Michigan: 5,
    Huron: 5,
    Erie: 5,
    Ontario: 5,
    "St. Clair": 3,
  };

  for (const [lake, min] of Object.entries(lakeMinimums)) {
    it(`has at least ${min} ports on Lake ${lake}`, () => {
      const lakePorts = ports.filter((p) => p.lake === lake);
      expect(lakePorts.length).toBeGreaterThanOrEqual(min);
    });
  }
});
