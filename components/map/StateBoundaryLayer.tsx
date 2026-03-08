import type { Feature } from "geojson";
import type { GeoPermissibleObjects } from "d3-geo";

interface StateBoundaryLayerProps {
  features: Feature[];
  path: (object: GeoPermissibleObjects) => string | null;
}

export function StateBoundaryLayer({ features, path }: StateBoundaryLayerProps) {
  return (
    <g className="state-boundary-layer">
      {features.map((feature, i) => (
        <path
          key={i}
          d={path(feature) ?? ""}
          fill="none"
          stroke="#78b8e8"
          strokeWidth={0.6}
          strokeDasharray="4,3"
          pointerEvents="none"
        />
      ))}
    </g>
  );
}
