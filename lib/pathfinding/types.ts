export interface RoutePoint {
  lng: number;
  lat: number;
}

export interface PathResult {
  points: RoutePoint[];
  gridCellCount: number;
}

export interface RouteLeg {
  from: import("@/lib/ports/types").Port;
  to: import("@/lib/ports/types").Port;
  path: PathResult | null;
  distanceNm: number;
}
