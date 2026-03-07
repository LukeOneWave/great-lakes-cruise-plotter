import type { Port } from "@/lib/ports/types";
import type { GeoProjection } from "d3-geo";
import { NAUTICAL_COLORS } from "./constants";

interface PortLayerProps {
  ports: Port[];
  projection: GeoProjection;
  selectedIds: Set<string>;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function PortLayer({
  ports,
  projection,
  selectedIds,
  hoveredId,
  onSelect,
  onHover,
}: PortLayerProps) {
  return (
    <g className="port-layer">
      {ports.map((port) => {
        const coords = projection([port.lng, port.lat]);
        if (!coords) return null;

        const [cx, cy] = coords;
        const isSelected = selectedIds.has(port.id);
        const isHovered = hoveredId === port.id;
        const showLabel = isSelected || isHovered;

        let r = 3;
        let fill: string = NAUTICAL_COLORS.portDefault;
        let opacity = 0.6;
        let stroke: string | undefined;
        let strokeWidth: number | undefined;

        if (isSelected) {
          r = 6;
          fill = NAUTICAL_COLORS.portSelected;
          opacity = 1;
          stroke = "white";
          strokeWidth = 1.5;
        } else if (isHovered) {
          r = 4;
          fill = NAUTICAL_COLORS.portHover;
          opacity = 0.8;
        }

        return (
          <g key={port.id} className="port-marker">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={fill}
              opacity={opacity}
              stroke={stroke}
              strokeWidth={strokeWidth}
              cursor="pointer"
              filter={isSelected ? "url(#port-glow)" : undefined}
              onClick={() => onSelect(port.id)}
              onMouseEnter={() => onHover(port.id)}
              onMouseLeave={() => onHover(null)}
            />
            {showLabel && (
              <text
                x={cx + 8}
                y={cy + 4}
                fill={NAUTICAL_COLORS.portLabel}
                fontFamily={NAUTICAL_COLORS.labelSerif}
                fontSize={11}
                pointerEvents="none"
              >
                {port.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
