import { request, setAccessToken } from "@api/client";
import { displayNameFromEmail, seededUser } from "@mocks/fixtures/user";
import type { MockUser } from "../types";

type TokenResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

type ConfirmationRequiredResponse = {
  status: "confirmation_required";
  expiresInSeconds?: number | null;
  resendCooldownSeconds?: number | null;
};

export type ConfirmationTimings = {
  expiresInSeconds: number | null;
  resendCooldownSeconds: number | null;
};

type AuthResponse = TokenResponse | ConfirmationRequiredResponse;

type MeResponse = {
  id?: string;
  displayName: string;
  email: string;
  memberSince?: string;
  createdAt?: string;
};

type GoogleStartResponse = {
  authorizeUrl: string;
};

export type AuthConfig = {
  google: { enabled: boolean };
  passwordSignUp: boolean;
};

export type AuthOutcome =
  | { status: "authenticated"; user: MockUser }
  | { status: "confirmation_required"; email: string; timings: ConfirmationTimings }
  | { status: "failed" };

function timingsFrom(response: ConfirmationRequiredResponse): ConfirmationTimings {
  return {
    expiresInSeconds: response.expiresInSeconds ?? null,
    resendCooldownSeconds: response.resendCooldownSeconds ?? null,
  };
}

function toUser(response: MeResponse): MockUser {
  return {
    id: response.id,
    displayName: response.displayName,
    email: response.email,
    password: "",
    memberSince: response.memberSince,
    createdAt: response.createdAt,
  };
}

export async function currentUser(): Promise<MockUser> {
  return toUser(await request<MeResponse>("/me"));
}

function isConfirmationRequired(response: unknown): response is ConfirmationRequiredResponse {
  return Boolean(
    response &&
      typeof response === "object" &&
      "status" in response &&
      response.status === "confirmation_required",
  );
}

export async function createAccount(email: string, password: string): Promise<AuthOutcome> {
  const response = await request<MeResponse | ConfirmationRequiredResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (isConfirmationRequired(response))
    return { status: "confirmation_required", email, timings: timingsFrom(response) };
  const token = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (isConfirmationRequired(token))
    return { status: "confirmation_required", email, timings: timingsFrom(token) };
  setAccessToken(token.accessToken);
  return { status: "authenticated", user: await currentUser() };
}

export async function authenticate(email: string, password: string): Promise<AuthOutcome> {
  try {
    const token = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (isConfirmationRequired(token))
      return { status: "confirmation_required", email, timings: timingsFrom(token) };
    setAccessToken(token.accessToken);
    return { status: "authenticated", user: await currentUser() };
  } catch {
    return { status: "failed" };
  }
}

export async function confirmEmail(email: string, code: string): Promise<MockUser | null> {
  try {
    const token = await request<TokenResponse>("/auth/confirm", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    setAccessToken(token.accessToken);
    return currentUser();
  } catch {
    return null;
  }
}

type ResendResponse = {
  status: "accepted";
  expiresInSeconds?: number | null;
  resendCooldownSeconds?: number | null;
};

export async function resendConfirmation(email: string): Promise<ConfirmationTimings> {
  const response = await request<ResendResponse>("/auth/confirm/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return {
    expiresInSeconds: response.expiresInSeconds ?? null,
    resendCooldownSeconds: response.resendCooldownSeconds ?? null,
  };
}

export async function getAuthConfig(): Promise<AuthConfig> {
  return request<AuthConfig>("/auth/config");
}

export async function startGoogle(intent: "sign-up" | "sign-in", next?: string | null): Promise<void> {
  const response = await request<GoogleStartResponse>("/auth/google/start", {
    method: "POST",
    body: JSON.stringify({ intent, next }),
  });
  window.location.assign(response.authorizeUrl);
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

export async function signOutRequest(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
  setAccessToken(null);
}

export const seededCredentials = {
  email: seededUser.email,
  password: seededUser.password,
};

export { displayNameFromEmail };
