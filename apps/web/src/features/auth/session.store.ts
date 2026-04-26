import { useMemo, useState } from "react";
import { clonePreferences, emptyPreferences, type Preferences } from "@features/onboarding";
import type { Language } from "@i18n";
import { defaultAccent, getAccent, type AccentPresetId } from "@theme/accents";
import { authenticate, createAccount, seededCredentials } from "./api/auth.api";
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

  function setLanguage(next: Language) {
    sessionStorage.setItem("campfire.language", next);
    setLanguageState(next);
  }

  function setAccent(next: AccentPresetId) {
    sessionStorage.setItem("campfire.accent", next);
    setAccentState(next);
  }

  function signUp(email: string, password: string) {
    const user = createAccount(email, password);
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("firstLogin");
    return user;
  }

  function signUpWithGoogle() {
    return signUp("google.member@campfire.test", "managed-google");
  }

  function signIn(email: string, password: string) {
    const user = authenticate(email, password);
    if (!user) return false;
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("returning");
    return true;
  }

  function signInWithGoogle() {
    signIn(seededCredentials.email, seededCredentials.password);
  }

  function savePreferences(next: Preferences) {
    const cloned = clonePreferences(next);
    setPreferences(cloned);
    setCurrentUser((user) => (user ? { ...user, preferences: cloned } : user));
  }

  function signOut() {
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
