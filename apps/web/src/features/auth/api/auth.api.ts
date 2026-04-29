import { request, setAccessToken } from "@api/client";
import { displayNameFromEmail, seededUser } from "@mocks/fixtures/user";
import type { MockUser } from "../types";

type TokenResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

type MeResponse = {
  id?: string;
  displayName: string;
  email: string;
  memberSince?: string;
  createdAt?: string;
};

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
    const token = await request<TokenResponse>("/auth/google-stub", {
      method: "POST",
      body: JSON.stringify({ intent }),
    });
    setAccessToken(token.accessToken);
    return currentUser();
  } catch {
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

export async function signOutRequest(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
  setAccessToken(null);
}

export const seededCredentials = {
  email: seededUser.email,
  password: seededUser.password,
};

export { displayNameFromEmail };
