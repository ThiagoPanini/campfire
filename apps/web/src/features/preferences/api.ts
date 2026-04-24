import { apiRequest } from "../../lib/http";
import type {
  OnboardingDeferralResponse,
  UserPreferencesPayload,
  UserPreferencesResponse,
} from "../../lib/api-types";

export async function getPreferences(accessToken: string): Promise<UserPreferencesResponse> {
  return apiRequest<UserPreferencesResponse>("/me/preferences", {
    method: "GET",
    accessToken,
  });
}

export async function savePreferences(
  accessToken: string,
  payload: UserPreferencesPayload,
): Promise<UserPreferencesResponse> {
  return apiRequest<UserPreferencesResponse>("/me/preferences", {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export async function deferOnboarding(accessToken: string): Promise<OnboardingDeferralResponse> {
  return apiRequest<OnboardingDeferralResponse>("/me/onboarding", {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({ status: "deferred" }),
  });
}
