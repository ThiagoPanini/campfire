import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Auth page states - public, no real Cognito calls
// ---------------------------------------------------------------------------

test("sign-in page renders email and password fields", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test("sign-up page renders registration fields", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test("sign-in page has a sign-up navigation option", async ({ page }) => {
  await page.goto("/signin");
  // Expect a link or button to navigate to sign-up
  const signUpLink = page.getByRole("button", { name: /sign up|create account|register/i }).or(
    page.getByRole("link", { name: /sign up|create account|register/i }),
  );
  await expect(signUpLink).toBeVisible();
});

test("sign-up page has a sign-in navigation option", async ({ page }) => {
  await page.goto("/signup");
  const signInLink = page.getByRole("button", { name: /sign in|log in/i }).or(
    page.getByRole("link", { name: /sign in|log in/i }),
  );
  await expect(signInLink).toBeVisible();
});

test("sign-in page does not expose mock-only local auth button in production-like mode", async ({ page }) => {
  await page.goto("/signin");
  // The mock sign-in path was removed; verify no button that auto-signs in via /_local/token
  const mockButton = page.getByRole("button", { name: /dev sign.in|local.sign.in|mock/i });
  await expect(mockButton).toHaveCount(0);
});

test("sign-in page navigates to /signup when sign-up link is clicked", async ({ page }) => {
  await page.goto("/signin");
  const signUpLink = page
    .getByRole("button", { name: /sign up|create account|register/i })
    .or(page.getByRole("link", { name: /sign up|create account|register/i }))
    .first();
  await signUpLink.click();
  await expect(page).toHaveURL(/\/signup/);
});
