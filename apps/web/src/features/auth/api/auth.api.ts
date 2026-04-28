import { request, setAccessToken } from "@api/client";
import { clonePreferences, emptyPreferences, type Preferences } from "@features/onboarding";
import { displayNameFromEmail, seededUser } from "@mocks/fixtures/user";
import type { MockUser } from "../types";

type TokenResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

type MeResponse = {
  displayName: string;
  email: string;
  firstLogin: boolean;
  preferences: Preferences;
};

type PreferencesPayload = {
  instruments: string[];
  genres: string[];
  context: string | null;
  goals: string[];
  experience: string | null;
};

const catalogAliases: Record<string, string> = {
  Guitar: "Acoustic Guitar",
  Cajon: "Cajón",
};

function catalogValue(value: unknown): string | null {
  if (typeof value === "string") return catalogAliases[value] ?? value;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  for (const key of ["label", "name", "value", "id"]) {
    const candidate = record[key];
    if (typeof candidate === "string") return catalogAliases[candidate] ?? candidate;
  }
  return null;
}

function catalogList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map(catalogValue)
    .filter((value): value is string => value !== null);
}

function preferencesPayload(preferences: Preferences): PreferencesPayload {
  return {
    instruments: catalogList(preferences.instruments),
    genres: catalogList(preferences.genres),
    context: catalogValue(preferences.context),
    goals: catalogList(preferences.goals),
    experience: catalogValue(preferences.experience),
  };
}

function toUser(response: MeResponse): MockUser {
  return {
    displayName: response.displayName,
    email: response.email,
    password: "",
    firstLogin: response.firstLogin,
    preferences: clonePreferences(response.preferences ?? emptyPreferences),
  };
}

export async function currentUser(): Promise<MockUser> {
  return toUser(await request<MeResponse>("/me"));
}

export async function createAccount(email: string, password: string): Promise<MockUser> {
  await request<MeResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = await request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(token.accessToken);
  return currentUser();
}

export async function authenticate(email: string, password: string): Promise<MockUser | null> {
  try {
    const token = await request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(token.accessToken);
    return currentUser();
  } catch {
    return null;
  }
}

export async function continueWithGoogle(intent: "sign-up" | "sign-in"): Promise<MockUser | null> {
  try {
    console.log("Google stub start:", intent);
    const token = await request<TokenResponse>("/auth/google-stub", {
      method: "POST",
      body: JSON.stringify({ intent }),
    });
    console.log("Google stub token received:", token);
    setAccessToken(token.accessToken);
    const user = await currentUser();
    console.log("Google stub user:", user);
    return user;
  } catch (err) {
    console.error("Google stub error:", err);
    return null;
  }
}

export async function refreshSession(): Promise<MockUser | null> {
  try {
    const token = await request<TokenResponse>("/auth/refresh", { method: "POST", credentials: "include" });
    setAccessToken(token.accessToken);
    return currentUser();
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function updatePreferences(preferences: Preferences): Promise<MockUser> {
  return toUser(
    await request<MeResponse>("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(preferencesPayload(preferences)),
    }),
  );
}

export async function signOutRequest(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
  setAccessToken(null);
}

export const seededCredentials = {
  email: seededUser.email,
  password: seededUser.password,
};

export { displayNameFromEmail };
