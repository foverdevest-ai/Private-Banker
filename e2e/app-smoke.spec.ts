import { test, expect } from "@playwright/test";

test("dashboard shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=Private Banker")).toBeVisible();
});
