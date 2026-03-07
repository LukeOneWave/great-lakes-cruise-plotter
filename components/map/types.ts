export interface MapDimensions {
  width: number;
  height: number;
}

export interface PortMarkerState {
  selectedIds: Set<string>;
  hoveredId: string | null;
}
