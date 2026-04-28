import { useEffect, useMemo, useState } from "react";
import type { Language } from "@i18n";
import { defaultAccent, getAccent, type AccentPresetId } from "@theme/accents";
import {
  authenticate,
  continueWithGoogle,
  createAccount,
  refreshSession,
  signOutRequest,
} from "./api/auth.api";
import type { MockUser } from "./types";

function readStoredLanguage(): Language {
  return sessionStorage.getItem("campfire.language") === "pt" ? "pt" : "en";
}

function readStoredAccent(): AccentPresetId {
  const stored = sessionStorage.getItem("campfire.accent") as AccentPresetId | null;
  return stored && getAccent(stored).id === stored ? stored : defaultAccent;
}

export function useSessionStore() {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
  const [accent, setAccentState] = useState<AccentPresetId>(readStoredAccent);

  const accentPreset = useMemo(() => getAccent(accent), [accent]);

  useEffect(() => {
    let cancelled = false;
    refreshSession().then((user) => {
      if (cancelled || !user) return;
      setCurrentUser(user);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setLanguage(next: Language) {
    sessionStorage.setItem("campfire.language", next);
    setLanguageState(next);
  }

  function setAccent(next: AccentPresetId) {
    sessionStorage.setItem("campfire.accent", next);
    setAccentState(next);
  }

  async function signUp(email: string, password: string) {
    const user = await createAccount(email, password).catch(() => null);
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  async function signUpWithGoogle() {
    const user = await continueWithGoogle("sign-up");
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  async function signIn(email: string, password: string) {
    const user = await authenticate(email, password);
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  async function signInWithGoogle() {
    const user = await continueWithGoogle("sign-in");
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  function signOut() {
    signOutRequest();
    setCurrentUser(null);
  }

  return {
    currentUser,
    language,
    accent,
    accentPreset,
    setLanguage,
    setAccent,
    signUp,
    signUpWithGoogle,
    signIn,
    signInWithGoogle,
    signOut,
  };
}

export type SessionStore = ReturnType<typeof useSessionStore>;
