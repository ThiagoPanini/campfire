import type { Instrument, ProficiencyLevel } from "./types";

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = ["learning", "practicing", "ready"];

export const INSTRUMENTS: Instrument[] = [
  "Acoustic Guitar",
  "Electric Guitar",
  "Bass",
  "Drums",
  "Vocals",
  "Piano / Keys",
  "Ukulele",
  "Violin",
  "Cajón",
  "Flute",
  "Other",
];

export const PROFICIENCY_DOTS: Record<ProficiencyLevel, number> = {
  learning: 1,
  practicing: 2,
  ready: 3,
};
