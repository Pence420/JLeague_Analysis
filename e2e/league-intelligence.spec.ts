import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("league intelligence presents its analytical journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "J1 League Intelligence" })).toBeVisible();
  await expect(page.getByText(/synthetic sample data/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Team Style Landscape" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Analyst Brief" })).toBeVisible();
  await expect(page.getByText(/not for recruitment decisions/i)).toBeVisible();
});

test("page has no horizontal overflow and keeps confidence context", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("heading", { name: "Data Confidence" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /primary/i }).first()).toBeVisible();
});

test("page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("captures the implemented dashboard for visual review", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Analyst Brief" })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath("j-scout-dashboard.png"), fullPage: true });
});
