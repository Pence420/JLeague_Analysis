import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IslandNav } from "./island-nav";

describe("IslandNav", () => {
  it("marks League as the current desktop destination", () => {
    render(<IslandNav activeHref="/" />);
    expect(screen.getAllByRole("link", { name: "League" }).every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("opens more mobile destinations", async () => {
    const user = userEvent.setup();
    render(<IslandNav activeHref="/" />);
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menu", { name: /more destinations/i })).toBeVisible();
  });
});
