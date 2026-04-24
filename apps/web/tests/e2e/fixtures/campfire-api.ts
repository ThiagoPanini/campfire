import type { Page } from "@playwright/test";

export async function stubCampfireApi(
  page: Page,
  options: { onboardingStatus?: "required" | "completed" | "deferred" } = {},
): Promise<void> {
  const onboardingStatus = options.onboardingStatus ?? "completed";

  await page.route("**/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "user_123",
          email: "ash@example.com",
          displayName: "Ash Rivera",
          status: "active",
          lastLoginAt: new Date().toISOString(),
        },
        auth: { email: "ash@example.com", emailVerified: true, methods: ["cognito"] },
        onboarding: { status: onboardingStatus, completedAt: null, deferredAt: null },
        methods: ["cognito"],
        bootstrap: { firstLogin: onboardingStatus === "required" },
        firstLogin: onboardingStatus === "required",
      }),
    });
  });

  await page.route("**/me/preferences", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        userId: "user_123",
        instruments: ["Guitar"],
        genres: ["Rock"],
        playContext: "friends",
        goals: ["Prepare for jam sessions"],
        experienceLevel: "learning",
        updatedAt: new Date().toISOString(),
      }),
    });
  });
}
