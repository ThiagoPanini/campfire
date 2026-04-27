// Real backend behavior: app load attempts a refresh-token rotation, then
// hydrates the current user from GET /me. Unlike the mock prototype, browser
// refresh after sign-in keeps the user signed in when the refresh cookie exists.
import { useEffect, useMemo, useState } from "react";
import { clonePreferences, emptyPreferences, type Preferences } from "@features/onboarding";
import type { Language } from "@i18n";
import { defaultAccent, getAccent, type AccentPresetId } from "@theme/accents";
import {
  authenticate,
  continueWithGoogle,
  createAccount,
  refreshSession,
  signOutRequest,
  updatePreferences,
} from "./api/auth.api";
import type { AuthMode, MockUser } from "./types";

function readStoredLanguage(): Language {
  return sessionStorage.getItem("campfire.language") === "pt" ? "pt" : "en";
}

function readStoredAccent(): AccentPresetId {
  const stored = sessionStorage.getItem("campfire.accent") as AccentPresetId | null;
  return stored && getAccent(stored).id === stored ? stored : defaultAccent;
}

export function useSessionStore() {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() => clonePreferences(emptyPreferences));
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
  const [accent, setAccentState] = useState<AccentPresetId>(readStoredAccent);
  const [authMode, setAuthMode] = useState<AuthMode>("firstLogin");

  const accentPreset = useMemo(() => getAccent(accent), [accent]);

  useEffect(() => {
    let cancelled = false;
    refreshSession().then((user) => {
      if (cancelled || !user) return;
      setCurrentUser(user);
      setPreferences(clonePreferences(user.preferences));
      setAuthMode(user.firstLogin ? "firstLogin" : "returning");
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
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("firstLogin");
    return true;
  }

  async function signUpWithGoogle() {
    const user = await continueWithGoogle("sign-up");
    if (!user) return false;
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("firstLogin");
    return true;
  }

  async function signIn(email: string, password: string) {
    const user = await authenticate(email, password);
    if (!user) return false;
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("returning");
    return true;
  }

  async function signInWithGoogle() {
    const user = await continueWithGoogle("sign-in");
    if (!user) return false;
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("returning");
    return true;
  }

  async function savePreferences(next: Preferences) {
    const cloned = clonePreferences(next);
    setPreferences(cloned);
    setCurrentUser((user) => (user ? { ...user, preferences: cloned } : user));
    try {
      const user = await updatePreferences(cloned);
      setCurrentUser(user);
      setPreferences(clonePreferences(user.preferences));
      setAuthMode("returning");
      return true;
    } catch {
      return false;
    }
  }

  function signOut() {
    signOutRequest();
    setCurrentUser(null);
    setPreferences(clonePreferences(emptyPreferences));
    setAuthMode("firstLogin");
  }

  return {
    currentUser,
    preferences,
    language,
    accent,
    accentPreset,
    authMode,
    setLanguage,
    setAccent,
    signUp,
    signUpWithGoogle,
    signIn,
    signInWithGoogle,
    savePreferences,
    signOut,
  };
}

export type SessionStore = ReturnType<typeof useSessionStore>;
