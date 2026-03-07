"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { exportSVG } from "@/lib/export/svg-export";
import { exportPNG } from "@/lib/export/png-export";
import { exportPDF } from "@/lib/export/pdf-export";

interface ExportMenuProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  tripSummary?: string;
}

export function ExportMenu({ svgRef, tripSummary }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const disabled = !svgRef.current;

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleExport = useCallback(
    async (format: "svg" | "png" | "pdf") => {
      const svg = svgRef.current;
      if (!svg) return;

      setIsOpen(false);
      setIsExporting(true);

      try {
        switch (format) {
          case "svg":
            await exportSVG(svg);
            break;
          case "png":
            await exportPNG(svg);
            break;
          case "pdf":
            await exportPDF(svg, undefined, tripSummary);
            break;
        }
      } catch (err) {
        console.error(`Export ${format.toUpperCase()} failed:`, err);
      } finally {
        setIsExporting(false);
      }
    },
    [svgRef, tripSummary]
  );

  const options = [
    { format: "svg" as const, label: "Download SVG" },
    { format: "png" as const, label: "Download PNG" },
    { format: "pdf" as const, label: "Download PDF" },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md
          bg-neutral-100 text-neutral-700 border border-neutral-300
          hover:bg-neutral-200 hover:border-neutral-400
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors"
      >
        {isExporting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            Export Map
            {/* Chevron down */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-neutral-200 z-50 py-1">
          {options.map(({ format, label }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="w-full text-left px-3 py-2 text-sm text-neutral-700
                hover:bg-neutral-100 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
