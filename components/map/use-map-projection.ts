import { useMemo } from "react";
import { geoConicEqualArea, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import type { GeoProjection, GeoPermissibleObjects } from "d3-geo";
import { MAP_CONFIG } from "./constants";

interface UseMapProjectionResult {
  projection: GeoProjection | null;
  path: ((object: GeoPermissibleObjects) => string | null) | null;
}

export function useMapProjection(
  width: number,
  height: number,
  data: FeatureCollection,
  padding: number = MAP_CONFIG.padding
): UseMapProjectionResult {
  return useMemo(() => {
    if (width === 0 || height === 0) {
      return { projection: null, path: null };
    }

    const projection = geoConicEqualArea()
      .parallels(MAP_CONFIG.projectionParallels)
      .rotate(MAP_CONFIG.projectionRotate)
      .fitExtent(
        [
          [padding, padding],
          [width - padding, height - padding],
        ],
        data
      );

    const pathGenerator = geoPath(projection);

    return { projection, path: pathGenerator };
  }, [width, height, data, padding]);
}
