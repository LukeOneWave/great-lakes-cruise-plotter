import type { Feature } from "geojson";
import type { GeoPermissibleObjects } from "d3-geo";
import { NAUTICAL_COLORS } from "./constants";

interface CoastlineLayerProps {
  features: Feature[];
  path: (object: GeoPermissibleObjects) => string | null;
}

export function CoastlineLayer({ features, path }: CoastlineLayerProps) {
  return (
    <g className="coastline-layer">
      {features.map((feature, i) => (
        <path
          key={i}
          d={path(feature) ?? ""}
          fill={NAUTICAL_COLORS.land}
          stroke={NAUTICAL_COLORS.landStroke}
          strokeWidth={0.8}
        />
      ))}
    </g>
  );
}
