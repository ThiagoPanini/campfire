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

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  "Acoustic Guitar": "Violão",
  "Electric Guitar": "Guitarra",
  Bass: "Baixo",
  Drums: "Bateria",
  Vocals: "Vocais",
  "Piano / Keys": "Piano / teclas",
  Ukulele: "Ukulele",
  Violin: "Violino",
  "Cajón": "Cajón",
  Flute: "Flauta",
  Other: "Outro",
};

export function instrumentLabel(instrument: Instrument | string | null | undefined) {
  if (!instrument) return "Instrumento não definido";
  return INSTRUMENT_LABELS[instrument as Instrument] ?? instrument;
}

export const PROFICIENCY_DOTS: Record<ProficiencyLevel, number> = {
  learning: 1,
  practicing: 2,
  ready: 3,
};
