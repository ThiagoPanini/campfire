import { expect, test } from "@playwright/test";
import { stubCampfireApi } from "./fixtures/campfire-api";

// ---------------------------------------------------------------------------
// Real Cognito / Google e2e acceptance tests
//
// These tests are opt-in and require real Cognito credentials.
// They are skipped unless the following environment variables are set:
//   E2E_REAL_AUTH=true
//   E2E_TEST_EMAIL=<verified Cognito email>
//   E2E_TEST_PASSWORD=<Cognito password>
//
// Run with:
//   E2E_REAL_AUTH=true E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npx playwright test auth-real-cognito
// ---------------------------------------------------------------------------

const REAL_AUTH = process.env["E2E_REAL_AUTH"] === "true";
const TEST_EMAIL = process.env["E2E_TEST_EMAIL"] ?? "";
const TEST_PASSWORD = process.env["E2E_TEST_PASSWORD"] ?? "";

test.describe("Real Cognito authentication (opt-in)", () => {
  test.skip(!REAL_AUTH, "Set E2E_REAL_AUTH=true with valid test credentials to run");

  test("email/password sign-in reaches home via onboarding", async ({ page }) => {
    await stubCampfireApi(page, { onboardingStatus: "completed" });

    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    // Real auth redirects through Cognito callback, then to /app or /onboarding
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/(app|onboarding)/);
  });

  test("sign-out returns to public landing", async ({ page }) => {
    await stubCampfireApi(page, { onboardingStatus: "completed" });

    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 15_000 });

    await page.goto("/app");
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/(signin|\/)/, { timeout: 10_000 });

    await page.goto("/app");
    await expect(page).toHaveURL(/\/signin/);
  });
});
