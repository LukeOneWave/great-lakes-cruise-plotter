/**
 * load-geo.ts
 *
 * Runtime TopoJSON to GeoJSON converter.
 * Loads the pre-built great-lakes.topo.json and converts it to
 * a GeoJSON FeatureCollection for rendering.
 */

import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import topoData from "./great-lakes.topo.json";
import statesTopoData from "./states.topo.json";

export function loadCoastlines(): FeatureCollection {
  const topo = topoData as unknown as Topology;
  const objectKey = Object.keys(topo.objects)[0];
  return feature(topo, topo.objects[objectKey]) as unknown as FeatureCollection;
}

export function loadStateBoundaries(): FeatureCollection {
  const topo = statesTopoData as unknown as Topology;
  const objectKey = Object.keys(topo.objects)[0];
  return feature(topo, topo.objects[objectKey]) as unknown as FeatureCollection;
}
