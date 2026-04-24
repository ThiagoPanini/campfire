import { expect, test } from "@playwright/test";
import { stubCampfireApi } from "./fixtures/campfire-api";

const SESSION_VALUE = JSON.stringify({
  accessToken: "test-token",
  displayName: "Ash Rivera",
  email: "ash@example.com",
  expiresAt: Date.now() + 3_600_000,
});

async function setSession(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate((s) => window.localStorage.setItem("campfire.session", s), SESSION_VALUE);
}

async function clearSession(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => window.localStorage.removeItem("campfire.session"));
}

// ---------------------------------------------------------------------------
// US4: Returning user (completed onboarding) enters home directly
// ---------------------------------------------------------------------------

test("returning user with completed onboarding enters /app directly", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "completed" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app/);
});

test("returning user with deferred onboarding enters /app directly", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "deferred" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app/);
});

// ---------------------------------------------------------------------------
// US4: Logout clears state and blocks protected routes
// ---------------------------------------------------------------------------

test("clicking sign-out clears session and blocks /app access", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "completed" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");

  await page.getByRole("button", { name: /sign out/i }).click();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/signin/);
});

test("session expiry redirects /app to /signin", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "completed" });
  await page.goto("/");

  // Write an expired session
  const expired = JSON.stringify({
    accessToken: "expired-token",
    displayName: "Ash Rivera",
    email: "ash@example.com",
    expiresAt: Date.now() - 1,
  });
  await page.evaluate((s) => window.localStorage.setItem("campfire.session", s), expired);

  await page.goto("/app");
  await expect(page).toHaveURL(/\/signin/);
});

test("clearing session storage blocks /onboarding after access", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding/);

  await clearSession(page);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/signin/);
});

// ---------------------------------------------------------------------------
// US4: /me returning 401 clears session and redirects
// ---------------------------------------------------------------------------

test("/me returning 401 redirects to /signin", async ({ page }) => {
  await page.route("**/me", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"unauthorized"}' });
  });

  await page.goto("/");
  await setSession(page);
  await page.goto("/app");

  await expect(page).toHaveURL(/\/signin/);
});
