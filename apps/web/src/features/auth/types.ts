import type { Preferences } from "@features/onboarding";

export type MockUser = {
  displayName: string;
  email: string;
  password: string;
  firstLogin: boolean;
  preferences: Preferences;
};

export type AuthMode = "firstLogin" | "returning";
