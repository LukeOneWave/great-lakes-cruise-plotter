import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpeedControl } from "../SpeedControl";

describe("SpeedControl", () => {
  it("renders slider with current speed value", () => {
    render(<SpeedControl speedKnots={15} onSpeedChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("15");
  });

  it("displays speed in knots", () => {
    render(<SpeedControl speedKnots={10} onSpeedChange={vi.fn()} />);
    expect(screen.getByText("10 knots")).toBeInTheDocument();
  });

  it("calls onSpeedChange when slider changes", () => {
    const onChange = vi.fn();
    render(<SpeedControl speedKnots={10} onSpeedChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith(20);
  });
});
