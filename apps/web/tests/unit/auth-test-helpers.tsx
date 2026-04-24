import type { BootstrapIdentityResponse, UserPreferencesResponse } from "../../src/lib/api-types";

export function sessionFixture(overrides: Partial<{ accessToken: string; expiresAt: number }> = {}) {
  return {
    accessToken: overrides.accessToken ?? "test-token",
    displayName: "Ash Rivera",
    email: "ash@example.com",
    expiresAt: overrides.expiresAt ?? Date.now() + 60_000,
  };
}

export function meFixture(
  onboardingStatus: BootstrapIdentityResponse["onboarding"]["status"] = "completed",
): BootstrapIdentityResponse {
  return {
    user: {
      id: "user_123",
      email: "ash@example.com",
      displayName: "Ash Rivera",
      status: "active",
      lastLoginAt: new Date().toISOString(),
    },
    auth: {
      email: "ash@example.com",
      emailVerified: true,
      methods: ["cognito"],
    },
    onboarding: {
      status: onboardingStatus,
      completedAt: onboardingStatus === "completed" ? new Date().toISOString() : null,
      deferredAt: onboardingStatus === "deferred" ? new Date().toISOString() : null,
    },
    methods: ["cognito"],
    bootstrap: { firstLogin: onboardingStatus === "required" },
    firstLogin: onboardingStatus === "required",
  };
}

export function preferencesFixture(): UserPreferencesResponse {
  return {
    userId: "user_123",
    instruments: ["Guitar"],
    genres: ["Rock"],
    playContext: "friends",
    goals: ["Prepare for jam sessions"],
    experienceLevel: "learning",
    updatedAt: new Date().toISOString(),
  };
}
