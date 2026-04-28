export const instruments = ["Acoustic Guitar", "Electric Guitar", "Bass", "Drums", "Vocals", "Piano / Keys", "Ukulele", "Violin", "Cajón", "Flute", "Other", "I don't play"] as const;
export const genres = ["Rock", "Hard Rock", "Heavy Metal", "Metalcore", "Metal", "Blues", "Pop", "Country", "Reggae", "Jazz", "MPB", "Samba", "Bossa Nova", "Forro", "Other"] as const;

export const contexts = [
  { id: "friends", label: "With friends" },
  { id: "amateur", label: "Amateur band" },
  { id: "pro", label: "Professional band" },
  { id: "solo", label: "Solo practice" },
  { id: "church", label: "Worship group" },
  { id: "sessions", label: "Jam sessions" },
  { id: "rehearsal_studio", label: "Rehearsal studio" },
  { id: "other", label: "Other" },
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
