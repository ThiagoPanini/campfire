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

export type InstrumentId = (typeof instruments)[number];
export type GenreId = (typeof genres)[number];
export type ContextId = (typeof contexts)[number]["id"];
export type GoalId = (typeof goals)[number];
export type ExperienceId = (typeof experiences)[number]["id"];
