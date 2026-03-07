export interface NavigationGrid {
  width: number;
  height: number;
  bbox: [number, number, number, number];
  cellSize: number;
  data: number[];
}

export type GridCell = [col: number, row: number];

export function toCell(
  grid: NavigationGrid,
  lng: number,
  lat: number
): GridCell {
  const col = Math.floor((lng - grid.bbox[0]) / grid.cellSize);
  const row = Math.floor((grid.bbox[3] - lat) / grid.cellSize);
  return [col, row];
}

export function isWater(
  grid: NavigationGrid,
  col: number,
  row: number
): boolean {
  if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) {
    return false;
  }
  return grid.data[row * grid.width + col] === 1;
}
