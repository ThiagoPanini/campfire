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
  displayNameFromEmail,
  refreshSession,
  seededCredentials,
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

  function signUp(email: string, password: string) {
    const user: MockUser = {
      displayName: displayNameFromEmail(email),
      email: email.trim(),
      password,
      firstLogin: true,
      preferences: clonePreferences(emptyPreferences),
    };
    setCurrentUser(user);
    setPreferences(clonePreferences(user.preferences));
    setAuthMode("firstLogin");
    createAccount(email, password).then((created) => {
      setCurrentUser(created);
      setPreferences(clonePreferences(created.preferences));
    });
    return user;
  }

  function signUpWithGoogle() {
    const user = signUp("google.member@campfire.test", "managed-google");
    continueWithGoogle("sign-up").then((created) => {
      if (!created) return;
      setCurrentUser(created);
      setPreferences(clonePreferences(created.preferences));
    });
    return user;
  }

  function signIn(email: string, password: string) {
    const optimistic: MockUser = {
      displayName: displayNameFromEmail(email),
      email: email.trim(),
      password,
      firstLogin: false,
      preferences: clonePreferences(emptyPreferences),
    };
    setCurrentUser(optimistic);
    setPreferences(clonePreferences(optimistic.preferences));
    setAuthMode("returning");
    authenticate(email, password).then((user) => {
      if (!user) {
        signOut();
        return;
      }
      setCurrentUser(user);
      setPreferences(clonePreferences(user.preferences));
      setAuthMode("returning");
    });
    return true;
  }

  function signInWithGoogle() {
    setCurrentUser({
      displayName: "Ada",
      email: seededCredentials.email,
      password: "",
      firstLogin: false,
      preferences: clonePreferences(emptyPreferences),
    });
    setPreferences(clonePreferences(emptyPreferences));
    setAuthMode("returning");
    continueWithGoogle("sign-in").then((user) => {
      if (!user) return;
      setCurrentUser(user);
      setPreferences(clonePreferences(user.preferences));
      setAuthMode("returning");
    });
  }

  function savePreferences(next: Preferences) {
    const cloned = clonePreferences(next);
    setPreferences(cloned);
    setCurrentUser((user) => (user ? { ...user, preferences: cloned } : user));
    updatePreferences(cloned).then((user) => {
      setCurrentUser(user);
      setPreferences(clonePreferences(user.preferences));
      setAuthMode("returning");
    });
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
