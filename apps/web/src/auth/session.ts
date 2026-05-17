import { useSyncExternalStore } from "react";

export type SessionUser = {
  username: string;
  email: string;
  joinedAt: string;
};

const STORAGE_KEY = "campfire.session.v1";

const listeners = new Set<() => void>();
let cache: SessionUser | null | undefined;

function readFromStorage(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (typeof parsed.username !== "string" || typeof parsed.email !== "string") {
      return null;
    }
    return {
      username: parsed.username,
      email: parsed.email,
      joinedAt: typeof parsed.joinedAt === "string" ? parsed.joinedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function getSession(): SessionUser | null {
  if (cache === undefined) {
    cache = readFromStorage();
  }
  return cache;
}

export function setSession(user: SessionUser | null) {
  cache = user;
  if (typeof window !== "undefined") {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  notify();
}

export function clearSession() {
  setSession(null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

export function deriveInitials(name: string, fallback: string = ""): string {
  const source = name.trim() || fallback.trim();
  if (!source) return "··";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toLowerCase();
  }
  return parts[0].slice(0, 2).toLowerCase();
}

export function deriveUsernameFromEmail(email: string): string {
  const handle = email.split("@")[0] ?? "amigo";
  return handle.replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase() || "amigo";
}
