import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["/", "League overview"],
  ["/teams", "Teams"],
  ["/players", "Player explorer"],
  ["/moneyball", "Recruitment Value Proxy"],
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

test("league overview keeps evidence and league distribution visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("2025-12-06").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "J1 2025 club performance" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Analyst Brief" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "League distribution" }),
  ).toBeVisible();
  await expect(page.getByText(/derived scores are labeled/i)).toBeVisible();
});

test("core player and recruitment interactions work", async ({ page }) => {
  await page.goto("/players");
  await page.getByLabel("Search players").fill("Hayakawa");
  await expect(
    page.getByRole("cell", { name: "HAYAKAWA Tomoki", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Select HAYAKAWA Tomoki").check();
  await expect(page.getByText("Compare (1)")).toBeVisible();

  await page.goto("/moneyball");
  await page.getByRole("button", { name: "Development" }).click();
  await expect(page.getByText("Recruitment Value Proxy").first()).toBeVisible();
  await page.getByLabel("Recruitment position").selectOption("GK");
  await expect(
    page.getByRole("cell", { name: "GK", exact: true }).first(),
  ).toBeVisible();
  await page.getByLabel("Minimum minutes").selectOption("450");
  await expect(
    page.getByText(/discovery mode includes smaller samples/i),
  ).toBeVisible();
  await expect(
    page.getByText(/partial screening available/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/base-data components available/i)).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Availability" }),
  ).toBeVisible();
  await expect(page.getByText("Base-data profile")).toBeVisible();
  await expect(
    page
      .getByRole("row")
      .nth(1)
      .getByText(/\d+(\.\d+)?/)
      .first(),
  ).toBeVisible();
});

test("comparison blocks cross-position score claims", async ({ page }) => {
  await page.goto("/compare");
  const playerA = page.getByLabel("Player A");
  const playerB = page.getByLabel("Player B");
  const goalkeeper = await playerA
    .locator("option")
    .filter({ hasText: "HAYAKAWA Tomoki" })
    .getAttribute("value");
  const forward = await playerB
    .locator("option")
    .filter({ hasText: "LEO CEARA" })
    .getAttribute("value");
  await playerA.selectOption(goalkeeper!);
  await playerB.selectOption(forward!);
  await expect(
    page.getByText(/cross-position score comparison is disabled/i),
  ).toBeVisible();
});

test("all routes avoid viewport overflow", async ({ page }) => {
  for (const [route] of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")]
        .filter(
          (element) =>
            element.getBoundingClientRect().right >
            document.documentElement.clientWidth + 0.5,
        )
        .slice(0, 5)
        .map((element) => ({
          className: element.className,
          tag: element.tagName,
          text: element.textContent?.trim().slice(0, 80),
          right: element.getBoundingClientRect().right,
        })),
    }));
    expect(
      overflow.scrollWidth,
      `${route} overflowed: ${JSON.stringify(overflow.offenders)}`,
    ).toBe(overflow.clientWidth);
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
  await page.goto("/moneyball");
  await expect(
    page.getByRole("heading", { name: "Recruitment Value Proxy" }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("recruitment-value-proxy.png"),
    fullPage: true,
  });
});
