import { expect, test } from "@playwright/test";
import { stubCampfireApi } from "./fixtures/campfire-api";

const SESSION_STORAGE = JSON.stringify({
  accessToken: "test-token",
  displayName: "Ash Rivera",
  email: "ash@example.com",
  expiresAt: Date.now() + 3_600_000,
});

async function setSession(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate((session) => {
    window.localStorage.setItem("campfire.session", session);
  }, SESSION_STORAGE);
}

// ---------------------------------------------------------------------------
// Onboarding page access and redirect
// ---------------------------------------------------------------------------

test("user with required onboarding is redirected from /app to /onboarding", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/onboarding/);
});

test("user with completed onboarding accesses /app directly", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "completed" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app/);
});

test("user with deferred onboarding accesses /app directly", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "deferred" });
  await page.goto("/");
  await setSession(page);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app/);
});

// ---------------------------------------------------------------------------
// Onboarding page content and interactions
// ---------------------------------------------------------------------------

test("onboarding page renders instrument selection", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.route("**/me/preferences", (route) => route.fulfill({ status: 404, body: "{}" }));
  await page.goto("/");
  await setSession(page);
  await page.goto("/onboarding");

  await expect(page.getByText("Guitar")).toBeVisible();
});

test("saving preferences on onboarding completes onboarding", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.route("**/me/preferences", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: "not_found" }) });
    } else {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          userId: "user_123",
          instruments: ["Guitar"],
          genres: ["Rock"],
          playContext: "friends",
          goals: [],
          experienceLevel: "learning",
          updatedAt: new Date().toISOString(),
        }),
      });
    }
  });
  await page.route("**/me/onboarding", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ onboarding: { status: "completed", completedAt: new Date().toISOString(), deferredAt: null } }),
    });
  });

  await page.goto("/");
  await setSession(page);
  await page.goto("/onboarding");

  await page.getByText("Guitar").click();
  await page.getByRole("button", { name: /save|continue|done/i }).first().click();

  await expect(page).toHaveURL(/\/app/);
});

test("deferring onboarding navigates to /app", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.route("**/me/preferences", (route) => route.fulfill({ status: 404, body: "{}" }));
  await page.route("**/me/onboarding", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ onboarding: { status: "deferred", completedAt: null, deferredAt: new Date().toISOString() } }),
    });
  });

  await page.goto("/");
  await setSession(page);
  await page.goto("/onboarding");

  await page.getByRole("button", { name: /skip|later|defer/i }).click();
  await expect(page).toHaveURL(/\/app/);
});

test("selections are preserved when a save error occurs", async ({ page }) => {
  await stubCampfireApi(page, { onboardingStatus: "required" });
  await page.route("**/me/preferences", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: "not_found" }) });
    } else {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: "invalid_preferences", message: "bad" }) });
    }
  });

  await page.goto("/");
  await setSession(page);
  await page.goto("/onboarding");

  await page.getByText("Guitar").click();
  await page.getByRole("button", { name: /save|continue|done/i }).first().click();

  // After error, the selection should still be visible/toggled
  await expect(page.getByText("Guitar")).toBeVisible();
  await expect(page).toHaveURL(/\/onboarding/);
});
