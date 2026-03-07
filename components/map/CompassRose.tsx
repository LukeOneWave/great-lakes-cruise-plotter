import { NAUTICAL_COLORS } from "./constants";

interface CompassRoseProps {
  x: number;
  y: number;
  size: number;
}

export function CompassRose({ x, y, size }: CompassRoseProps) {
  const r = size / 2;
  const pointLength = r * 0.85;
  const pointWidth = r * 0.2;

  return (
    <g className="compass-rose" transform={`translate(${x},${y})`} opacity={0.6}>
      {/* Outer circle */}
      <circle
        r={r}
        fill="none"
        stroke={NAUTICAL_COLORS.compassDark}
        strokeWidth={1}
        opacity={0.4}
      />
      <circle
        r={r * 0.9}
        fill="none"
        stroke={NAUTICAL_COLORS.compassDark}
        strokeWidth={0.5}
        opacity={0.3}
      />

      {/* North point (dark) */}
      <polygon
        points={`0,${-pointLength} ${pointWidth},0 0,0`}
        fill={NAUTICAL_COLORS.compassDark}
      />
      <polygon
        points={`0,${-pointLength} ${-pointWidth},0 0,0`}
        fill={NAUTICAL_COLORS.compassDark}
      />

      {/* South point (light) */}
      <polygon
        points={`0,${pointLength} ${pointWidth},0 0,0`}
        fill={NAUTICAL_COLORS.compassLight}
      />
      <polygon
        points={`0,${pointLength} ${-pointWidth},0 0,0`}
        fill={NAUTICAL_COLORS.compassLight}
      />

      {/* West point (dark) */}
      <polygon
        points={`${-pointLength},0 0,${pointWidth} 0,0`}
        fill={NAUTICAL_COLORS.compassDark}
      />
      <polygon
        points={`${-pointLength},0 0,${-pointWidth} 0,0`}
        fill={NAUTICAL_COLORS.compassDark}
      />

      {/* East point (light) */}
      <polygon
        points={`${pointLength},0 0,${pointWidth} 0,0`}
        fill={NAUTICAL_COLORS.compassLight}
      />
      <polygon
        points={`${pointLength},0 0,${-pointWidth} 0,0`}
        fill={NAUTICAL_COLORS.compassLight}
      />

      {/* Cardinal labels */}
      <text
        y={-r * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.3}
        fontFamily={NAUTICAL_COLORS.labelSerif}
        fill={NAUTICAL_COLORS.compassDark}
        fontWeight="bold"
      >
        N
      </text>
      <text
        y={r * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.25}
        fontFamily={NAUTICAL_COLORS.labelSerif}
        fill={NAUTICAL_COLORS.compassDark}
      >
        S
      </text>
      <text
        x={r * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.25}
        fontFamily={NAUTICAL_COLORS.labelSerif}
        fill={NAUTICAL_COLORS.compassDark}
      >
        E
      </text>
      <text
        x={-r * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={r * 0.25}
        fontFamily={NAUTICAL_COLORS.labelSerif}
        fill={NAUTICAL_COLORS.compassDark}
      >
        W
      </text>
    </g>
  );
}
