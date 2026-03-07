import type { Feature, Polygon, MultiPolygon, FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";

export type GreatLakeName =
  | "Superior"
  | "Michigan"
  | "Huron"
  | "Erie"
  | "Ontario"
  | "St. Clair";

export interface WaterwayCorridorProperties {
  name: string;
  type: "canal" | "river" | "strait" | "channel";
}

export type WaterwayCorridor = Feature<
  Polygon | MultiPolygon,
  WaterwayCorridorProperties
>;

export type WaterwayCorridorCollection = FeatureCollection<
  Polygon | MultiPolygon,
  WaterwayCorridorProperties
>;

export type { Feature, Polygon, MultiPolygon, FeatureCollection, Topology };
