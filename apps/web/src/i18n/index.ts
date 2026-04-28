import { en } from "./locales/en";
import { pt as ptRaw } from "./locales/pt";
import type { Language } from "./types";

export type { Language } from "./types";

const pt: typeof en = ptRaw;

export const copy = { en, pt };

export function translate(language: Language): typeof en {
  return copy[language];
}
