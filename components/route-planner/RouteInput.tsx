"use client";

import { useState, useCallback } from "react";
import type { Port } from "@/lib/ports/types";

interface RouteInputProps {
  ports: Port[];
  onRouteSubmit: (portIds: string[]) => void;
}

function findBestMatch(query: string, ports: Port[]): Port | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // Exact match on full name
  const exact = ports.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact;

  // Match on city part only (before the comma)
  const cityMatch = ports.find(
    (p) => p.name.toLowerCase().split(",")[0].trim() === q
  );
  if (cityMatch) return cityMatch;

  // Starts-with on city part
  const startsWith = ports.find((p) =>
    p.name.toLowerCase().split(",")[0].trim().startsWith(q)
  );
  if (startsWith) return startsWith;

  // Substring anywhere in name
  const substring = ports.find((p) => p.name.toLowerCase().includes(q));
  if (substring) return substring;

  return undefined;
}

export function RouteInput({ ports, onRouteSubmit }: RouteInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    setError(null);
    const names = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const name of names) {
      const port = findBestMatch(name, ports);
      if (port) {
        matched.push(port.id);
      } else {
        unmatched.push(name);
      }
    }

    if (unmatched.length > 0) {
      setError(`Not found: ${unmatched.join(", ")}`);
      return;
    }

    onRouteSubmit(matched);
  }, [value, ports, onRouteSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="px-4 py-3 border-b border-neutral-200">
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
        Enter Stops
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Erie, Cleveland, Detroit, New Baltimore"
          className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
