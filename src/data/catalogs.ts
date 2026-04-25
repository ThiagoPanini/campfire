export const instruments = ["Guitar", "Bass", "Drums", "Piano / Keys", "Vocals", "Violin", "Cavaquinho", "Ukulele", "Cajon", "Mandolin", "Flute", "Other"] as const;
export const genres = ["Rock", "MPB", "Samba", "Jazz", "Forro", "Bossa Nova", "Pop", "Blues", "Country", "Metal", "Reggae", "Funk", "Other"] as const;

export const contexts = [
  { id: "friends", label: "Roda de amigos" },
  { id: "amateur", label: "Banda amadora" },
  { id: "pro", label: "Banda profissional" },
  { id: "solo", label: "Pratica solo" },
  { id: "church", label: "Grupo de louvor" },
  { id: "sessions", label: "Sessoes / Jam sessions" },
] as const;

export const goals = [
  "Learn new songs faster",
  "Track my full repertoire",
  "Share my set with the group",
  "Prepare for jam sessions",
  "Practice more consistently",
  "Know what I can already play",
] as const;

export const experiences = [
  { id: "beginner", label: "Beginner", sub: "Less than 1 year" },
  { id: "learning", label: "Learning", sub: "1-3 years" },
  { id: "intermediate", label: "Intermediate", sub: "3-7 years" },
  { id: "advanced", label: "Advanced", sub: "7+ years" },
] as const;

export const accentPresets = [
  { id: "EMBER", hex: "#FF6B2B", dark: "#7C1E00" },
  { id: "FLAME", hex: "#FFAA00", dark: "#7A4800" },
  { id: "GOLD", hex: "#FFD166", dark: "#6B4900" },
  { id: "COPPER", hex: "#E8813A", dark: "#6B2E00" },
  { id: "BRASS", hex: "#D4A84B", dark: "#5C3A00" },
] as const;

export type InstrumentId = (typeof instruments)[number];
export type GenreId = (typeof genres)[number];
export type ContextId = (typeof contexts)[number]["id"];
export type GoalId = (typeof goals)[number];
export type ExperienceId = (typeof experiences)[number]["id"];
export type AccentPresetId = (typeof accentPresets)[number]["id"];

export const defaultAccent: AccentPresetId = "COPPER";

export function getAccent(id: AccentPresetId) {
  return accentPresets.find((preset) => preset.id === id) ?? accentPresets[3];
}
