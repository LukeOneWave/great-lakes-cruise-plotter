"use client";

import { useMemo, useState } from "react";
import { loadCoastlines } from "@/lib/geo/load-geo";
import { useMapProjection } from "./use-map-projection";
import { MapDefs } from "./MapDefs";
import { CoastlineLayer } from "./CoastlineLayer";
import { GraticuleLayer } from "./GraticuleLayer";
import { CompassRose } from "./CompassRose";
import { PortLayer } from "./PortLayer";
import { RouteLayer } from "./RouteLayer";
import { MAP_CONFIG } from "./constants";
import type { Port } from "@/lib/ports/types";
import type { RoutePoint } from "@/lib/pathfinding/types";

interface NauticalMapProps {
  width?: number;
  height?: number;
  ports?: Port[];
  selectedPortIds?: Set<string>;
  onPortSelect?: (portId: string) => void;
  routePoints?: RoutePoint[];
}

// Load coastline data once (static, never changes)
const coastlineData = loadCoastlines();

export function NauticalMap({
  width = MAP_CONFIG.defaultWidth,
  height = MAP_CONFIG.defaultHeight,
  ports = [],
  selectedPortIds = new Set<string>(),
  onPortSelect,
  routePoints,
}: NauticalMapProps) {
  const { projection, path } = useMapProjection(width, height, coastlineData);
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);

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

      {/* Layer 5: Port markers (above land, below compass rose) */}
      {ports.length > 0 && (
        <PortLayer
          ports={ports}
          projection={projection}
          selectedIds={selectedPortIds}
          hoveredId={hoveredPortId}
          onSelect={(id) => onPortSelect?.(id)}
          onHover={setHoveredPortId}
        />
      )}

      {/* Layer 5.5: Route line (above ports, below compass) */}
      {routePoints && routePoints.length >= 2 && (
        <RouteLayer routePoints={routePoints} projection={projection} />
      )}

      {/* Layer 6: Compass rose (above everything) */}
      {compassPosition && (
        <CompassRose x={compassPosition.x} y={compassPosition.y} size={60} />
      )}
    </svg>
  );
}
