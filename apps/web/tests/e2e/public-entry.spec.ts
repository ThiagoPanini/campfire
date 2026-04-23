import { expect, test } from "@playwright/test";

test("renders the landing page and can enter the protected shell in dev mode", async ({ page }) => {
  await page.route("http://127.0.0.1:8010/_local/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "dev-token",
        displayName: "Ash Rivera",
        email: "ash@example.com",
        expiresAt: Date.now() + 60_000,
      }),
    });
  });

  await page.route("http://127.0.0.1:8010/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "user_123",
          email: "ash@example.com",
          displayName: "Ash Rivera",
          status: "active",
          lastLoginAt: "2026-04-23T12:00:00+00:00",
        },
        bootstrap: {
          firstLogin: true,
        },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Private rehearsal space for the next jam that actually happens.")).toBeVisible();

  await page.getByRole("button", { name: "Enter Campfire" }).click();
  await page.goto("/app/me");

  await expect(page.getByText("Campfire Foundation")).toBeVisible();
});
