import { useMemo, useState } from "react";
import type { AccentPresetId, ContextId, ExperienceId, GenreId, GoalId, InstrumentId } from "../data/catalogs";
import { defaultAccent, getAccent } from "../data/catalogs";
import type { Language } from "../data/copy";
import { displayNameFromEmail, emptyPreferences, seededPreferences, seededUser } from "../data/mock-user";

export type Preferences = {
  instruments: InstrumentId[];
  genres: GenreId[];
  context: ContextId | null;
  goals: GoalId[];
  experience: ExperienceId | null;
};

export type MockUser = {
  displayName: string;
  email: string;
  password: string;
  firstLogin: boolean;
  preferences: Preferences;
};

export type AuthMode = "firstLogin" | "returning";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clonePreferences(preferences: Preferences): Preferences {
  return {
    instruments: [...preferences.instruments],
    genres: [...preferences.genres],
    context: preferences.context,
    goals: [...preferences.goals],
    experience: preferences.experience,
  };
}

function readStoredLanguage(): Language {
  return sessionStorage.getItem("campfire.language") === "pt" ? "pt" : "en";
}

function readStoredAccent(): AccentPresetId {
  const stored = sessionStorage.getItem("campfire.accent") as AccentPresetId | null;
  return stored && getAccent(stored).id === stored ? stored : defaultAccent;
}

export function validateAuth(email: string, password: string) {
  return {
    email: emailPattern.test(email.trim()),
    password: password.length >= 8,
  };
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
    const user: MockUser = {
      displayName: displayNameFromEmail(email),
      email: email.trim(),
      password,
      firstLogin: true,
      preferences: clonePreferences(emptyPreferences),
    };
    setCurrentUser(user);
    setPreferences(clonePreferences(emptyPreferences));
    setAuthMode("firstLogin");
    return user;
  }

  function signUpWithGoogle() {
    return signUp("google.member@campfire.test", "managed-google");
  }

  function signIn(email: string, password: string) {
    if (email.trim().toLowerCase() !== seededUser.email || password !== seededUser.password) {
      return false;
    }
    const user = { ...seededUser, preferences: clonePreferences(seededPreferences) };
    setCurrentUser(user);
    setPreferences(clonePreferences(seededPreferences));
    setAuthMode("returning");
    return true;
  }

  function signInWithGoogle() {
    signIn(seededUser.email, seededUser.password);
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
