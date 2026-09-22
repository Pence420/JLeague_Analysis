import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ErrorState from "./error";
import Loading from "./loading";
import NotFound from "./not-found";

describe("global application states", () => {
  it("keeps loading geometry stable", () => {
    const { container } = render(<Loading />);
    expect(container.querySelectorAll('[data-skeleton="panel"]')).toHaveLength(
      6,
    );
  });

  it("offers recovery after a route error without leaking details", () => {
    render(
      <ErrorState
        error={new Error("network detail")}
        reset={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("network detail")).not.toBeInTheDocument();
  });

  it("renders a useful custom 404", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("link", { name: /return to league intelligence/i }),
    ).toHaveAttribute("href", "/");
  });
});
