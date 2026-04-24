import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";

import { env } from "../../lib/env";
import { authConfig } from "./config";

const STORAGE_KEY = "campfire.session";

export type SessionState = {
  accessToken: string;
  displayName: string;
  email: string;
  expiresAt: number;
};

type DevSessionPayload = {
  accessToken: string;
  displayName: string;
  email: string;
  expiresAt: number;
};

function readSession(): SessionState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionState;

    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: SessionState | null): void {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function persistSessionFromTokens(tokens: {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
}): void {
  persistSession({
    accessToken: tokens.accessToken,
    displayName: "Campfire member",
    email: "",
    expiresAt: tokens.expiresAt,
  });
  window.dispatchEvent(new CustomEvent("campfire-auth-changed"));
}

export function getSession(): SessionState | null {
  return readSession();
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

async function createDevSession(): Promise<SessionState> {
  const response = await fetch(env.localAuthTokenUrl);

  if (!response.ok) {
    throw new Error("Failed to create local development session.");
  }

  const payload = (await response.json()) as DevSessionPayload;
  return payload;
}

function createUserManager(): UserManager {
  return new UserManager({
    authority: authConfig.authority,
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    post_logout_redirect_uri: authConfig.postLogoutRedirectUri,
    response_type: authConfig.responseType,
    scope: authConfig.scope,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  });
}

export async function beginGoogleSignIn(): Promise<void> {
  await createUserManager().signinRedirect();
}

export async function completeRedirectSignIn(): Promise<void> {
  const user = await createUserManager().signinRedirectCallback();
  persistOidcSession(user);
  window.dispatchEvent(new CustomEvent("campfire-auth-changed"));
}

export async function createLocalDevSessionForTests(): Promise<void> {
  persistSession(await createDevSession());
  window.dispatchEvent(new CustomEvent("campfire-auth-changed"));
}

function persistOidcSession(user: User): void {
  persistSession({
    accessToken: user.access_token,
    displayName: user.profile.name ?? user.profile.preferred_username ?? "Campfire member",
    email: String(user.profile.email ?? ""),
    expiresAt: user.expires_at ? user.expires_at * 1000 : Date.now() + 1000 * 60 * 30,
  });
}

export async function signOut(): Promise<void> {
  const existing = getSession();
  persistSession(null);
  window.dispatchEvent(new CustomEvent("campfire-auth-changed"));

  if (!import.meta.env.DEV && existing) {
    await createUserManager().signoutRedirect();
  }
}

export function requireAuthenticatedPath(pathname: string): string {
  return pathname === "/" ? "/app" : pathname;
}

export function subscribeToSessionChanges(listener: () => void): () => void {
  const onChange = (): void => listener();
  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("campfire-auth-changed", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("campfire-auth-changed", onChange);
    window.removeEventListener("storage", onStorage);
  };
}
