"use client";

interface SpeedControlProps {
  speedKnots: number;
  onSpeedChange: (speed: number) => void;
}

export function SpeedControl({ speedKnots, onSpeedChange }: SpeedControlProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="speed-slider"
        className="text-sm font-semibold text-neutral-700 uppercase tracking-wide"
      >
        Cruise Speed
      </label>
      <div className="flex items-center gap-3">
        <input
          id="speed-slider"
          type="range"
          role="slider"
          min={5}
          max={30}
          step={1}
          value={speedKnots}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-sm font-medium text-neutral-700 whitespace-nowrap w-16 text-right">
          {speedKnots} knots
        </span>
      </div>
    </div>
  );
}
