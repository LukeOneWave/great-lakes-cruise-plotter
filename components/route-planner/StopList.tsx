"use client";

import { StopItem } from "./StopItem";
import type { Port } from "@/lib/ports/types";

interface StopListProps {
  stops: Port[];
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}

export function StopList({ stops, onReorder, onRemove }: StopListProps) {
  if (stops.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-6">
        Click ports on the map to add stops
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {stops.map((port, i) => (
        <StopItem
          key={port.id}
          index={i}
          port={port}
          onReorder={onReorder}
          onRemove={onRemove}
        />
      ))}
      {stops.length === 1 && (
        <p className="text-xs text-neutral-400 text-center py-2">
          Add another stop to plan a route
        </p>
      )}
    </div>
  );
}
