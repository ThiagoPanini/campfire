import { useEffect, useState } from "react";
import {
  authenticate,
  confirmEmail,
  createAccount,
  getAuthConfig,
  refreshSession,
  resendConfirmation,
  signOutRequest,
  startGoogle,
  type AuthConfig,
  type ConfirmationTimings,
} from "./api/auth.api";
import type { MockUser } from "./types";

let initialRefreshPromise: Promise<MockUser | null> | null = null;

function refreshInitialSession(): Promise<MockUser | null> {
  initialRefreshPromise ??= refreshSession();
  return initialRefreshPromise;
}

export function useSessionStore() {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(
    sessionStorage.getItem("campfire.auth.unconfirmedEmail"),
  );
  const [confirmationTimings, setConfirmationTimings] = useState<ConfirmationTimings | null>(null);
  const [confirmationIssuedAt, setConfirmationIssuedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthConfig()
      .then((config) => {
        if (!cancelled) setAuthConfig(config);
      })
      .catch(() => {
        if (!cancelled)
          setAuthConfig({
            google: { enabled: false },
            passwordSignUp: { enabled: true, requiresEmailConfirmation: true },
          });
      });
    refreshInitialSession()
      .then((user) => {
        if (cancelled) return;
        if (user) {
          setCurrentUser(user);
          if (new URLSearchParams(window.location.search).get("auth") === "ok") {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function rememberUnconfirmed(email: string, timings: ConfirmationTimings | null = null) {
    sessionStorage.setItem("campfire.auth.unconfirmedEmail", email);
    setUnconfirmedEmail(email);
    if (timings) {
      setConfirmationTimings(timings);
      setConfirmationIssuedAt(Date.now());
    }
  }

  function clearUnconfirmed() {
    sessionStorage.removeItem("campfire.auth.unconfirmedEmail");
    setUnconfirmedEmail(null);
    setConfirmationTimings(null);
    setConfirmationIssuedAt(null);
  }

  async function signUp(email: string, password: string) {
    setAuthSubmitting(true);
    const result = await createAccount(email, password).catch(() => ({ status: "failed" as const }));
    setAuthSubmitting(false);
    if (result.status === "confirmation_required") {
      rememberUnconfirmed(result.email, result.timings);
      return "confirmation_required" as const;
    }
    if (result.status !== "authenticated") return false;
    clearUnconfirmed();
    setCurrentUser(result.user);
    return "authenticated" as const;
  }

  async function signUpWithGoogle(): Promise<"redirecting" | "failed"> {
    setAuthSubmitting(true);
    try {
      await startGoogle("sign-up", sessionStorage.getItem("campfire.auth.next"));
      sessionStorage.removeItem("campfire.auth.next");
      return "redirecting";
    } catch {
      setAuthSubmitting(false);
      return "failed";
    }
  }

  async function signIn(email: string, password: string) {
    setAuthSubmitting(true);
    const result = await authenticate(email, password);
    setAuthSubmitting(false);
    if (result.status === "confirmation_required") {
      rememberUnconfirmed(result.email, result.timings);
      return "confirmation_required" as const;
    }
    if (result.status !== "authenticated") return false;
    clearUnconfirmed();
    setCurrentUser(result.user);
    return "authenticated" as const;
  }

  async function confirm(email: string, code: string) {
    setAuthSubmitting(true);
    const user = await confirmEmail(email, code);
    setAuthSubmitting(false);
    if (!user) return false;
    clearUnconfirmed();
    setCurrentUser(user);
    return true;
  }

  async function resend(email: string): Promise<ConfirmationTimings | null> {
    try {
      const timings = await resendConfirmation(email);
      setConfirmationTimings(timings);
      setConfirmationIssuedAt(Date.now());
      return timings;
    } catch {
      return null;
    }
  }

  async function signInWithGoogle(): Promise<"redirecting" | "failed"> {
    setAuthSubmitting(true);
    try {
      await startGoogle("sign-in", sessionStorage.getItem("campfire.auth.next"));
      sessionStorage.removeItem("campfire.auth.next");
      return "redirecting";
    } catch {
      setAuthSubmitting(false);
      return "failed";
    }
  }

  function signOut() {
    signOutRequest();
    sessionStorage.removeItem("campfire.auth.next");
    clearUnconfirmed();
    setCurrentUser(null);
  }

  return {
    currentUser,
    authReady,
    authConfig,
    authSubmitting,
    unconfirmedEmail,
    confirmationTimings,
    confirmationIssuedAt,
    signUp,
    signUpWithGoogle,
    signIn,
    signInWithGoogle,
    confirm,
    resend,
    signOut,
  };
}

export type SessionStore = ReturnType<typeof useSessionStore>;
