import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContextHeader } from "./context-header";
import { MetricValue } from "@/components/ui/metric-value";

describe("League overview context", () => {
  it("always identifies the fixture as synthetic sample data", () => {
    render(<ContextHeader snapshotDate="2025-07-20" methodologyVersion="sample-0.1.0" minimumMinutes={900} onMinimumMinutesChange={() => undefined} />);
    expect(screen.getByText(/synthetic sample data/i)).toBeVisible();
  });

  it("switches to low-sample mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ContextHeader snapshotDate="2025-07-20" methodologyVersion="sample-0.1.0" minimumMinutes={900} onMinimumMinutesChange={onChange} />);
    await user.selectOptions(screen.getByLabelText(/minimum minutes/i), "450");
    expect(onChange).toHaveBeenCalledWith(450);
  });

  it("renders absent metrics as Not available", () => {
    render(<MetricValue value={null} format="decimal" label="Unavailable metric" />);
    expect(screen.getByText("Not available")).toBeVisible();
  });
});
