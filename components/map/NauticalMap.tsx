"use client";

import { useMemo } from "react";
import { loadCoastlines } from "@/lib/geo/load-geo";
import { useMapProjection } from "./use-map-projection";
import { MapDefs } from "./MapDefs";
import { CoastlineLayer } from "./CoastlineLayer";
import { GraticuleLayer } from "./GraticuleLayer";
import { CompassRose } from "./CompassRose";
import { MAP_CONFIG } from "./constants";

interface NauticalMapProps {
  width?: number;
  height?: number;
  selectedPortIds?: Set<string>;
  onPortSelect?: (portId: string) => void;
}

// Load coastline data once (static, never changes)
const coastlineData = loadCoastlines();

export function NauticalMap({
  width = MAP_CONFIG.defaultWidth,
  height = MAP_CONFIG.defaultHeight,
}: NauticalMapProps) {
  const { projection, path } = useMapProjection(width, height, coastlineData);

  // Compute compass rose position - center of Lake Superior
  const compassPosition = useMemo(() => {
    if (!projection) return null;
    const pos = projection([-87.5, 47.5]);
    return pos ? { x: pos[0], y: pos[1] } : null;
  }, [projection]);

  if (!projection || !path) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Layer 1: Water background with depth gradient */}
      <rect
        width={width}
        height={height}
        fill="url(#water-depth)"
      />

      {/* Layer 2: SVG definitions (gradients, filters) */}
      <MapDefs />

      {/* Layer 3: Graticule grid (under land so it shows on water) */}
      <GraticuleLayer projection={projection} path={path} />

      {/* Layer 4: Coastline fills (land over graticule) */}
      <CoastlineLayer features={coastlineData.features} path={path} />

      {/* Layer 5: Compass rose (on water, under future port layer) */}
      {compassPosition && (
        <CompassRose x={compassPosition.x} y={compassPosition.y} size={60} />
      )}
    </svg>
  );
}
