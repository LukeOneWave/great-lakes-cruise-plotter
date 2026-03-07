"use client";

import { useState, type DragEvent } from "react";
import type { Port } from "@/lib/ports/types";

interface StopItemProps {
  index: number;
  port: Port;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}

export function StopItem({ index, port, onReorder, onRemove }: StopItemProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-center gap-2 p-2 bg-white rounded border cursor-grab active:cursor-grabbing ${
        dragOver ? "border-blue-400" : "border-neutral-200"
      }`}
    >
      <span className="text-xs font-bold text-neutral-400 w-5 text-center">
        {index + 1}
      </span>
      <span className="text-neutral-400 select-none" aria-hidden>
        &#x2630;
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-neutral-800 truncate">
          {port.name}
        </div>
        <div className="text-xs text-neutral-500">{port.lake}</div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-neutral-400 hover:text-red-500 transition-colors px-1"
        aria-label={`Remove ${port.name}`}
      >
        &times;
      </button>
    </div>
  );
}
