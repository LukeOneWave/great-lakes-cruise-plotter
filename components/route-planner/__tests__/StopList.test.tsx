import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopList } from "../StopList";
import type { Port } from "@/lib/ports/types";

const mockPorts: Port[] = [
  { id: "duluth", name: "Duluth", lake: "Lake Superior", lat: 46.78, lng: -92.1, country: "US" },
  { id: "chicago", name: "Chicago", lake: "Lake Michigan", lat: 41.88, lng: -87.62, country: "US" },
];

describe("StopList", () => {
  it("renders empty state message when no stops", () => {
    render(<StopList stops={[]} onReorder={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Click ports on the map to add stops")).toBeInTheDocument();
  });

  it("renders port names when stops provided", () => {
    render(<StopList stops={mockPorts} onReorder={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Duluth")).toBeInTheDocument();
    expect(screen.getByText("Chicago")).toBeInTheDocument();
  });

  it("remove button calls onRemove with correct index", () => {
    const onRemove = vi.fn();
    render(<StopList stops={mockPorts} onReorder={vi.fn()} onRemove={onRemove} />);
    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    fireEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
