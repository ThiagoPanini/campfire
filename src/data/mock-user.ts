import type { Preferences } from "../app/session-store";

export const emptyPreferences: Preferences = {
  instruments: [],
  genres: [],
  context: null,
  goals: [],
  experience: null,
};

export const seededPreferences: Preferences = {
  instruments: ["Guitar", "Vocals"],
  genres: ["Rock", "MPB", "Bossa Nova"],
  context: "friends",
  goals: ["Track my full repertoire", "Share my set with the group"],
  experience: "intermediate",
};

export const seededUser = {
  displayName: "Ada",
  email: "ada@campfire.test",
  password: "campfire123",
  firstLogin: false,
  preferences: seededPreferences,
};

export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] || "Member";
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Member";
}
