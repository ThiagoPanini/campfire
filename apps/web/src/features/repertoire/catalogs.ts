import type { Instrument, ProficiencyLevel } from "./types";

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = ["learning", "practicing", "ready"];

export const INSTRUMENTS: Instrument[] = [
  "Guitar",
  "Bass",
  "Drums",
  "Piano / Keys",
  "Vocals",
  "Violin",
  "Cavaquinho",
  "Ukulele",
  "Cajón",
  "Mandolin",
  "Flute",
  "Other",
];

export const PROFICIENCY_DOTS: Record<ProficiencyLevel, number> = {
  learning: 1,
  practicing: 2,
  ready: 3,
};
