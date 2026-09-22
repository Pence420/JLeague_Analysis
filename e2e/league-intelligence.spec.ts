import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["/", "League overview"],
  ["/teams", "Teams"],
  ["/players", "Player explorer"],
  ["/moneyball", "Moneyball shortlist"],
  ["/compare", "Player comparison"],
  ["/methodology", "Methodology"],
] as const;

test("every primary destination loads instead of falling into 404", async ({
  page,
}) => {
  for (const [route, heading] of routes) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should return 200`).toBe(200);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("This page could not be found.")).toHaveCount(
      0,
    );
  }
});

test("league overview keeps evidence and backend provenance visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText(/synthetic sample/i).first()).toBeVisible();
  await expect(
    page.getByText(/API connected|local fallback/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Team Style Landscape" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Analyst Brief" }),
  ).toBeVisible();
  await expect(page.getByText(/not for recruitment decisions/i)).toBeVisible();
});

test("core player and moneyball interactions work", async ({ page }) => {
  await page.goto("/players");
  await page.getByLabel("Search players").fill("Ren");
  await expect(
    page.getByRole("cell", { name: "Ren Amano", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Select Ren Amano").check();
  await expect(page.getByText("Compare (1)")).toBeVisible();

  await page.goto("/moneyball");
  await page.getByRole("button", { name: "Development" }).click();
  await expect(page.getByText("Moneyball score")).toBeVisible();
});

test("all routes avoid viewport overflow", async ({ page }) => {
  for (const [route] of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow, `${route} should not overflow horizontally`).toBe(false);
  }
});

test("league page has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);
});

test("captures the redesigned dashboard for visual review", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Analyst Brief" }),
  ).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: testInfo.outputPath("j-scout-dashboard.png"),
    fullPage: true,
  });
});
