// Auth feature's API surface. Today it wraps mock fixtures; when the real
// backend arrives, swap these implementations to use `@api/client`.
//
// Hard rule: `@mocks/*` imports are allowed here and only here within the
// auth feature.

import { clonePreferences, emptyPreferences } from "@features/onboarding";
import { displayNameFromEmail, seededPreferences, seededUser } from "@mocks/fixtures/user";
import type { MockUser } from "../types";

export function createAccount(email: string, password: string): MockUser {
  return {
    displayName: displayNameFromEmail(email),
    email: email.trim(),
    password,
    firstLogin: true,
    preferences: clonePreferences(emptyPreferences),
  };
}

export function authenticate(email: string, password: string): MockUser | null {
  if (email.trim().toLowerCase() !== seededUser.email || password !== seededUser.password) {
    return null;
  }
  return { ...seededUser, preferences: clonePreferences(seededPreferences) };
}

export const seededCredentials = {
  email: seededUser.email,
  password: seededUser.password,
};
