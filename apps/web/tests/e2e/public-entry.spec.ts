import { expect, test } from "@playwright/test";

test("landing page renders public value proposition without authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Build your personal repertoire by instrument")).toBeVisible();
  await expect(page.getByText(/EARLY ACCESS/)).toBeVisible();
  await expect(page.getByText(/alpha/i)).toBeVisible();
});

test("ENTER CAMPFIRE primary CTA routes to /signup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /enter campfire/i }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("sign-in nav action routes to /signin", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/signin$/);
});

test("/app without session redirects to /signin", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/signin/);
});

test("/onboarding without session redirects to /signin", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/signin/);
});

test("/signin and /signup are reachable without authentication", async ({ page }) => {
  await page.goto("/signin");
  await expect(page).toHaveURL(/\/signin$/);
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/signup$/);
});
