import { NAUTICAL_COLORS } from "./constants";

export function MapDefs() {
  return (
    <defs>
      {/* Water depth gradient - deep center to light edges */}
      <radialGradient id="water-depth" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor={NAUTICAL_COLORS.waterDeep} />
        <stop offset="60%" stopColor={NAUTICAL_COLORS.waterMid} />
        <stop offset="100%" stopColor={NAUTICAL_COLORS.waterLight} />
      </radialGradient>

      {/* Port glow filter for selected ports */}
      <filter id="port-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
