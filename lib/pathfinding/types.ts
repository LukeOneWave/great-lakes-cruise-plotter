export interface RoutePoint {
  lng: number;
  lat: number;
}

export interface PathResult {
  points: RoutePoint[];
  gridCellCount: number;
}
