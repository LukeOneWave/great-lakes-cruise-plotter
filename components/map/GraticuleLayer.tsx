import { useMemo } from "react";
import { geoGraticule } from "d3-geo";
import type { GeoProjection, GeoPermissibleObjects } from "d3-geo";
import { NAUTICAL_COLORS, MAP_CONFIG } from "./constants";

interface GraticuleLayerProps {
  projection: GeoProjection;
  path: (object: GeoPermissibleObjects) => string | null;
}

export function GraticuleLayer({ projection, path }: GraticuleLayerProps) {
  const { graticule, meridianLabels, parallelLabels } = useMemo(() => {
    const graticuleGenerator = geoGraticule()
      .extent(MAP_CONFIG.graticuleExtent as unknown as [[number, number], [number, number]])
      .step(MAP_CONFIG.graticuleStep);

    const graticuleMesh = graticuleGenerator();

    // Generate meridian labels (longitude lines)
    const [lonMin, latMin] = MAP_CONFIG.graticuleExtent[0];
    const [lonMax, latMax] = MAP_CONFIG.graticuleExtent[1];
    const [lonStep, latStep] = MAP_CONFIG.graticuleStep;

    const mLabels: { text: string; position: [number, number] }[] = [];
    for (let lon = lonMin; lon <= lonMax; lon += lonStep) {
      const projected = projection([lon, latMin]);
      if (projected) {
        mLabels.push({
          text: `${Math.abs(lon)}\u00B0W`,
          position: projected as [number, number],
        });
      }
    }

    // Generate parallel labels (latitude lines)
    const pLabels: { text: string; position: [number, number] }[] = [];
    for (let lat = latMin; lat <= latMax; lat += latStep) {
      const projected = projection([lonMin, lat]);
      if (projected) {
        pLabels.push({
          text: `${Math.abs(lat)}\u00B0N`,
          position: projected as [number, number],
        });
      }
    }

    return {
      graticule: graticuleMesh,
      meridianLabels: mLabels,
      parallelLabels: pLabels,
    };
  }, [projection]);

  return (
    <g className="graticule-layer">
      <path
        d={path(graticule) ?? ""}
        fill="none"
        stroke={NAUTICAL_COLORS.gridLine}
        strokeWidth={0.5}
        strokeDasharray="4,4"
        opacity={0.3}
      />
      {meridianLabels.map((label, i) => (
        <text
          key={`m-${i}`}
          x={label.position[0]}
          y={label.position[1] + 12}
          fontSize={9}
          fill={NAUTICAL_COLORS.gridLine}
          textAnchor="middle"
          fontFamily={NAUTICAL_COLORS.labelSerif}
          opacity={0.5}
        >
          {label.text}
        </text>
      ))}
      {parallelLabels.map((label, i) => (
        <text
          key={`p-${i}`}
          x={label.position[0] - 4}
          y={label.position[1] + 3}
          fontSize={9}
          fill={NAUTICAL_COLORS.gridLine}
          textAnchor="end"
          fontFamily={NAUTICAL_COLORS.labelSerif}
          opacity={0.5}
        >
          {label.text}
        </text>
      ))}
    </g>
  );
}
