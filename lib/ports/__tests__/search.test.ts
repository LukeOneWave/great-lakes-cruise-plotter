import { describe, it, expect } from "vitest";
import {
  getAllPorts,
  searchPorts,
  getPortsByLake,
  getPortById,
} from "@/lib/ports/ports";

describe("getAllPorts", () => {
  it("returns all ports", () => {
    const ports = getAllPorts();
    expect(ports.length).toBeGreaterThanOrEqual(80);
    expect(ports.length).toBeLessThanOrEqual(100);
  });
});

describe("searchPorts", () => {
  it("returns at least 1 result for 'chicago' containing Chicago", () => {
    const results = searchPorts("chicago");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.name.includes("Chicago"))).toBe(true);
  });

  it("returns ports on Lake Superior for 'superior'", () => {
    const results = searchPorts("superior");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.lake === "Superior" || p.name.toLowerCase().includes("superior"))).toBe(true);
  });

  it("returns empty array for empty query", () => {
    const results = searchPorts("");
    expect(results).toEqual([]);
  });

  it("is case-insensitive", () => {
    const lower = searchPorts("chicago");
    const upper = searchPorts("CHICAGO");
    const mixed = searchPorts("ChIcAgO");
    expect(lower).toEqual(upper);
    expect(lower).toEqual(mixed);
  });
});

describe("getPortsByLake", () => {
  it("returns only Michigan ports for Michigan", () => {
    const results = getPortsByLake("Michigan");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.lake === "Michigan")).toBe(true);
  });

  it("returns ports for all lakes", () => {
    const lakes = [
      "Superior",
      "Michigan",
      "Huron",
      "Erie",
      "Ontario",
      "St. Clair",
    ] as const;
    for (const lake of lakes) {
      const results = getPortsByLake(lake);
      expect(results.length).toBeGreaterThan(0);
    }
  });
});

describe("getPortById", () => {
  it("returns the Chicago port for 'chicago-il'", () => {
    const port = getPortById("chicago-il");
    expect(port).toBeDefined();
    expect(port!.name).toContain("Chicago");
    expect(port!.lake).toBe("Michigan");
  });

  it("returns undefined for nonexistent ID", () => {
    const port = getPortById("nonexistent");
    expect(port).toBeUndefined();
  });
});
